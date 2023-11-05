const PERIODS = ["Daily", "Weekly", "Biweekly", "Monthly", "Yearly"];
const options = getDateFormattingOptions();
var user_currency = null;

function loadBudget(id, startDate, endDate) {
    fillProfilePics(); // Get the profile images on the page filled.

    fetch('/data/budget-expenses?id=' + id).then(response => response.json()).then((responseData) => {
        const budget = responseData.budget;
        const expenses = responseData.expenses;
        user_currency = responseData.currency;
        configureViewDates(startDate, budget.budgetPeriod);
        document.getElementById('viewing-start-date').addEventListener('change', (e) => {
            configureViewDates(e.target.value, budget.budgetPeriod);
            changeBudgetDates(id, e.target.value);
        })

        const chartData = allChartDataAsArray(budget, expenses);
        const currentChart = generateVariousCharts(chartData, 0, 1);
        const limitedChartsContainer = document.createElement("div");
        limitedChartsContainer.append(currentChart);
        limitedChartsContainer.id = "limited-charts-container";

        // Create a container for limited charts to switch around
        const chartContainer = document.getElementById('details-chart-container');
        chartContainer.innerHTML = "";
        chartContainer.append(limitedChartsContainer);
        
        const dotCarousel = carouselButtons(chartData, "details-chart-dots", "limited-charts-container", 1, generateVariousCharts);
        chartContainer.append(dotCarousel);
        
        document.getElementById('details-name').textContent = budget.name;

        if (budget.description == "") {
            document.getElementById('details-description').textContent = "None";
        }
        else {
            document.getElementById('details-description').textContent = budget.description;
        }
        
        if(budget.startDate == null) {
            document.getElementById('details-date').textContent = "None";
        } else {
            const startDate = new Date(budget.startDate);
            document.getElementById('details-date').textContent = startDate.toLocaleDateString('en-us', options);
        }
        
        if (budget.endDate == null) {
            document.getElementById('details-date-end').textContent = "None";
        } else {
            const endDate = new Date(budget.endDate);
            document.getElementById('details-date-end').textContent = endDate.toLocaleDateString('en-us', options);
        }

        document.getElementById('details-edit').onclick = () => {
            window.location.href = "/form/update-budget?id=" + id;
        };

        if (budget.recurring) {
            document.getElementById('recur-img').src = 'static/images/recurIcon.svg';

            const period = PERIODS[budget.budgetPeriod].toLocaleLowerCase();
            document.getElementById('recur-description').textContent = "Recurs " + period;
        }

        // Create 'expenses' section
        document.getElementById('expense-container').append(generateTableUI(0, expenses, responseData.currency, 0));

        // Hide placeholders
        hidePlaceholders();

        // Activate Carousel dots
        changeActiveDot(0, "details-chart-dots");
    });
}

function changeBudgetDates(id, startDate) {
    fetch('/data/budget-expenses?id=' + id + '&date=' + startDate).then(response => response.json()).then((responseData) => {
        const budget = responseData.budget;
        const expenses = responseData.expenses;

        const chartData = allChartDataAsArray(budget, expenses);
        const currentChart = generateVariousCharts(chartData, 0, 1);
        const limitedChartsContainer = document.getElementById("limited-charts-container");
        limitedChartsContainer.innerHTML = "";
        limitedChartsContainer.append(currentChart);

        // Get the container for limited charts and carousel dots
        const chartContainer = document.getElementById('details-chart-container');
        chartContainer.innerHTML = "";
        chartContainer.append(limitedChartsContainer);
        
        const dotCarousel = carouselButtons(chartData, "details-chart-dots", "limited-charts-container", 1, generateVariousCharts);
        chartContainer.append(dotCarousel);
    });
}

function dashboardBudgetAction() {
    window.location.assign("/dashboard?refresh=false&tab=budgets");
}

function createExpenseLink() {
    window.location.href = "/form/create-expense";
}

function generateVariousCharts(items, slideNum, maxShow) {
    Chart.defaults.plugins.legend.display = false;

    if (slideNum == 0) {
        const donutChart = document.createElement('canvas');
        const data = items[0];

        new Chart(donutChart, {
            type: "doughnut",
            data: {
                datasets: [{
                    data: data.data,
                    backgroundColor: data.colors,
                    borderColor: COLORS_DARK,
                    borderWidth: 2.5,
                }],
                labels: data.labels,
            },
            plugins: [
                doughnutText
            ],
            options: {
                elements: {
                    center: {
                        text: user_currency + data.dataText[0] + "\n／\n" + user_currency + data.dataText[1],
                        color: COLORS_LIGHT,
                        minFontSize: 14, // Default is 20 (in px), set to false and text will not wrap.
                        lineHeight: 25 // Default is 25 (in px), used for when text wraps
                    }
                },
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let dataObject = context.dataset;
                                return user_currency + dataObject.data[context.dataIndex];
                            }
                        }
                    }
                }
            }
        });

        const fullchart1 = document.createElement("div");
        fullchart1.classList.add("full-size-chart");
        fullchart1.append(donutChart);

        const donutHeader = document.createElement("p");
        donutHeader.textContent = "Budget Amount Used";
        const returnDiv = document.createElement('div');
        returnDiv.id = 'limited-charts';
        returnDiv.classList.add('vertical-container');
        returnDiv.append(donutHeader, fullchart1);
        return returnDiv;
    } else if (slideNum == 1) {
        const lineChart = document.createElement('canvas');
        const data = items[1];

        new Chart(lineChart, {
            type: "line",
            data: {
                labels: data.map(row => row.year),
                datasets: [{
                    data: data.map(row => row.count),
                    backgroundColor: COLORS_DARK,
                    borderColor: COLORS_GREEN,
                    borderWidth: 2.5,
                }],
            },
            options: {
                title: {
                    display: true,
                    text: "Amount Used per Budget Period",
                    class: "chart-title"
                },
                maintainAspectRatio: false,
                scales: {
                    x: {
                        display: true,
                        grid: {
                            drawTicks: true,
                            color: COLORS_NAVY
                        },
                        ticks: {
                            color: COLORS_GREY
                        }
                    },
                    y: {
                        display: true,
                        grid: {
                            drawTicks: true,
                            color: COLORS_NAVY
                        },
                        ticks: {
                            color: COLORS_GREY,
                            beginAtZero: true,
                            maxTicksLimit: 5,
                            callback: function(value, index, values) {
                                return formatNumber(value);
                            }
                        },
                        title: {
                            color: COLORS_GREY,
                            font: {
                                size: 15,
                            },
                            display: true,
                            text: "Amount (" + user_currency + ")"
                        }
                    }
                },
                tooltips: {
                    callbacks: {
                        label: function(tooltipItems, data) {
                            return user_currency + tooltipItems.yLabel.toString();
                        }
                    }
                }
            }
        });

        const returnDiv = document.createElement('div');
        returnDiv.id = 'limited-charts';
        returnDiv.append(lineChart);
        return returnDiv;
    }
}

function configureViewDates(startDate, period) {
    const startDateInput = document.getElementById("viewing-start-date");
    const endDate = document.getElementById("viewing-end-date");

    var startDate = configureFilterDate(startDate, period);
    startDateInput.value = startDate;

    // Creating UTC date from the given start date
    if (startDate != "") {
        var UTCDate = startDate.split('-');
        UTCDate[1] = UTCDate[1] - 1;
        startDate = new Date(...UTCDate);
    }

    var endDateValue = endDate.innerText;
    if (endDateValue != "") {
        var UTCDate = endDateValue.split('-');
        UTCDate[1] = UTCDate[1] - 1;
        endDateValue = new Date(...UTCDate);
    }

    endDate.innerText = calculateEndDate(startDate, period).toLocaleDateString({ timeZone: 'UTC' });;
}

function updateQuickStat(summary, message) {
    const statSummary = document.getElementById('stat-summary');
    statSummary.innerText = summary;
    const quickStat = document.getElementById('quick-stat');
    quickStat.innerText = message;
}

function allChartDataAsArray(budget, expenses) {
    var toReturn = [];
    toReturn.push(budgetUsedAmount(budget), budgetUsePerPeriod(budget.period, expenses));
    return toReturn;
}

function budgetUsedAmount(budget) {
    const availableAmount = parseFloat((budget.amount).toFixed(2));
    const currentUsedAmount = parseFloat((budget.usedAmount).toFixed(2));
    const totalUsedAmount = parseFloat((budget.totalUsedAmount).toFixed(2));

    if (totalUsedAmount > availableAmount) { // The user has overspent in their budget
        if (currentUsedAmount <= availableAmount) {
            updateQuickStat(
                "You are currently within budget, but an upcoming expense will put you over " + user_currency + String(totalUsedAmount - availableAmount) + ".", 
                "Keep this in mind while making plans and consider making some changes to your upcoming expenses."
            )
        } else {
            updateQuickStat(
                "You are over budget by " + String(user_currency) + String(totalUsedAmount - availableAmount) + "!",
                "That's okay! It happens. Try to take some time to figure out where you may have overspent and think about adjusting your expenses for next month."
            )
        }
        const colors = [COLORS_RED];
        const labels = ["Amount Used"]
        const data = [
            totalUsedAmount, 
        ];

        return { "data": data, "colors": colors, "labels": labels, "dataText": [String(data[0]), String(availableAmount)] };
    } else {
        if (totalUsedAmount == availableAmount) {
            updateQuickStat(
                "You are just within budget!",
                "In fact, you spent exactly your budget! Be careful; spend anything more, and you will be over budget."
            )
        } else {
            updateQuickStat(
                "You are within your budget! Nice Job!",
                "You have " + String(user_currency) + String(parseFloat((availableAmount - totalUsedAmount).toFixed(2))) + " left in this budget. Don't forget to take into account your upcoming expenses."
            )
        }
        const colors = [COLORS_GREEN, COLORS_GREY, COLORS_NAVY];
        const labels = ["Amount Used", "Upcoming Expenses", "Amount Left"]
        const data = [
            currentUsedAmount, 
            parseFloat((totalUsedAmount - currentUsedAmount).toFixed(2)), //How much is upcoming
            parseFloat((availableAmount - totalUsedAmount).toFixed(2)) // How much is remaining after upcoming expenses
        ];

        return { "data": data, "colors": colors, "labels": labels, "dataText": [totalUsedAmount, availableAmount]};
    }
}

function budgetUsePerPeriod(period, expenses) {
    if (period == 0) { // Daily
        // Should show 7 days for a full week

    } else if (period == 1 || period == 2) { // Weekly or Biweekly
        // Should show 4 weeks for about a full month
    } else if (period == 3) { // Monthly
        // Should show all 12 months
        
    } else if (period == 4) { // Yearly
        // Should show past 5 years
        
    }
    return [
        { year: 2010, count: 10 },
        { year: 2011, count: 20 },
        { year: 2012, count: 15 },
        { year: 2013, count: 25 },
        { year: 2014, count: 22 },
        { year: 2015, count: 30 },
        { year: 2016, count: 28 },
    ];
}
// Plugin credited to stackoverflow users: https://stackoverflow.com/questions/20966817/how-to-add-text-inside-the-doughnut-chart-using-chart-js
const doughnutText = {
    id: 'doughnut-centertext',
    beforeDraw: function(chart) {
        if (chart.config.options.elements.hasOwnProperty("center")) {
            // Get ctx from string
            var ctx = chart.ctx;

            // Get options from the center object in options
            var centerConfig = chart.config.options.elements.center;
            var fontStyle = 'Kanit';
            var txt = centerConfig.text;
            var color = centerConfig.color || '#000';
            var maxFontSize = centerConfig.maxFontSize || 30;
            var sidePadding = centerConfig.sidePadding || 20;
            var sidePaddingCalculated = (sidePadding / 100) * (chart._metasets[chart._metasets.length-1].data[0].innerRadius * 2)
            // Start with a base font of 30px
            ctx.font = "30px " + fontStyle;

            // Get the width of the string and also the width of the element minus 10 to give it 5px side padding
            var stringWidth = ctx.measureText(txt).width;
            var elementWidth = (chart._metasets[chart._metasets.length-1].data[0].innerRadius * 2) - sidePaddingCalculated;            

            // Find out how much the font can grow in width.
            var widthRatio = elementWidth / stringWidth;
            var newFontSize = Math.floor(30 * widthRatio);
            var elementHeight = (chart._metasets[chart._metasets.length-1].data[0].innerRadius * 2);

            // Pick a new font size so it will not be larger than the height of label.
            var fontSizeToUse = Math.min(newFontSize, elementHeight, maxFontSize);
            var minFontSize = centerConfig.minFontSize;
            var lineHeight = centerConfig.lineHeight || 25;
            var wrapText = false;

            if (minFontSize === undefined) {
                minFontSize = 20;
            }

            if (minFontSize && fontSizeToUse < minFontSize) {
                fontSizeToUse = minFontSize;
                wrapText = true;
            }

            // Set font settings to draw it correctly.
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            var centerX = ((chart.chartArea.left + chart.chartArea.right) / 2);
            var centerY = ((chart.chartArea.top + chart.chartArea.bottom) / 2);
            ctx.font = fontSizeToUse + "px " + fontStyle;
            ctx.fillStyle = color;

            if (!wrapText) {
                ctx.fillText(txt, centerX, centerY);
                return;
            }

            var words = txt.split(' ');
            var line = '';
            var lines = [];

            // Break words up into multiple lines if necessary
            for (var n = 0; n < words.length; n++) {
                var testLine = line + words[n] + ' ';
                var metrics = ctx.measureText(testLine);
                var testWidth = metrics.width;
                if (testWidth > elementWidth && n > 0) {
                    lines.push(line);
                    line = words[n] + ' ';
                } else {
                    line = testLine;
                }
            }

            // Move the center up depending on line height and number of lines
            centerY -= (lines.length / 2) * lineHeight;

            for (var n = 0; n < lines.length; n++) {
                ctx.fillText(lines[n], centerX, centerY);
                centerY += lineHeight;
            }
            //Draw text in center
            ctx.fillText(line, centerX, centerY);
        }
    }
};