const PERIODS = ["Daily", "Weekly", "Biweekly", "Monthly", "Yearly"];
const options = getDateFormattingOptions();
var user_currency = null;
var fullExpenseDict = null;
var viewStart = null;
var viewEnd = null;
var budgetPeriodConst = 0;

function loadBudget(id, startDate, endDate) {
    fillProfilePics(); // Get the profile images on the page filled.
    createOptionsPanel(id);
    setTimeout(() => {
        showCookieConsent(true);
    }, 1000);

    fetch('/data/budget-expenses?id=' + id + '&date=' + startDate + '&fullExpenses=True').then(response => response.json()).then((responseData) => {
        const budget = responseData.budget;
        user_currency = responseData.currency;
        fullExpenseDict = responseData.fullExpenses;
        budgetPeriodConst = budget.budgetPeriod;
        setViewDates(startDate, budgetPeriodConst);

        const expenses = {
            "expenses": responseData.expenses,
            "categories": [budget.name]
        }

        configureViewDates(startDate, budget.budgetPeriod);
        document.getElementById('viewing-start-date').addEventListener('change', (e) => {
            configureViewDates(e.target.value, budget.budgetPeriod);
            changeBudgetDates(id, e.target.value);
        })

        const chartData = allChartDataAsArray(budget, startDate);
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
            const rawDate = new Date(budget.startDate);
            const startDate = new Date(rawDate.getUTCFullYear(), rawDate.getUTCMonth(), rawDate.getUTCDate());

            document.getElementById('details-date').textContent = startDate.toLocaleDateString('en-us', options);
        }
        
        if (budget.endDate == null) {
            document.getElementById('details-date-end').textContent = "None";
        } else {
            const rawDate = new Date(budget.endDate);
            const endDate = new Date(rawDate.getUTCFullYear(), rawDate.getUTCMonth(), rawDate.getUTCDate());
            
            document.getElementById('details-date-end').textContent = endDate.toLocaleDateString('en-us', options);
        }

        if (budget.recurring) {
            document.getElementById('recur-img').src = 'static/images/recurIcon.svg';

            const period = PERIODS[budget.budgetPeriod].toLocaleLowerCase();
            document.getElementById('recur-description').textContent = "Recurs " + period;
        }

        // Create 'expenses' section
        document.getElementById('expense-container').append(generateTableUI(0, expenses, responseData.currency, 0));

        // Check to see if an 'upcoming expenses' section is needed
        const upcomingTable = generateTableUI(0, expenses, responseData.currency, 1)
        if (!upcomingTable.classList.contains('empty-table')) {
            document.getElementById('upcoming-expenses').style.display = "grid";

            const upcomingExpenses = document.getElementById('upcoming-expense-container');
            upcomingExpenses.innerHTML = "";
            upcomingExpenses.append(upcomingTable);        
        } else {
            document.getElementById('upcoming-expenses').style.display = "none";
        }

        // Hide placeholders
        hidePlaceholders();

        // Activate Carousel dots
        changeActiveDot(0, "details-chart-dots");
    });
}

function changeBudgetDates(id, startDate) {
    var fetchRequest = "";
    var fullExpenses = false;
    
    const tempStart = getUTCDateFromString(startDate);
    if (startDate instanceof Date) {
        startDate.toLocaleDateString("en-us", { timeZone:'UTC' })
    }

    if (tempStart < viewStart || tempStart > viewEnd) {
        setViewDates(startDate, budgetPeriodConst);
        fullExpenses = true;
        fetchRequest = '/data/budget-expenses?id=' + id + '&date=' + startDate + '&fullExpenses=True';
    } else {
        fetchRequest = '/data/budget-expenses?id=' + id + '&date=' + startDate + '&fullExpenses=False';
    }

    // Save this slide number to show the user the correct slide
    const slideNum = document.getElementById("limited-charts").dataset.slideNum;

    fetch(fetchRequest).then(response => response.json()).then((responseData) => {
        const budget = responseData.budget;
        const expenses = {
            "expenses": responseData.expenses,
            "categories": [budget.name]
        }

        if (fullExpenses == true) {
            fullExpenseDict = responseData.fullExpenses;
        }

        const chartData = allChartDataAsArray(budget, startDate);
        const currentChart = generateVariousCharts(chartData, slideNum, 1);
        const limitedChartsContainer = document.getElementById("limited-charts-container");
        limitedChartsContainer.innerHTML = "";
        limitedChartsContainer.append(currentChart);

        // Get the container for limited charts and carousel dots
        const chartContainer = document.getElementById('details-chart-container');
        chartContainer.innerHTML = "";
        chartContainer.append(limitedChartsContainer);
        
        const dotCarousel = carouselButtons(chartData, "details-chart-dots", "limited-charts-container", 1, generateVariousCharts);
        chartContainer.append(dotCarousel);

        // Update the expenses section
        const expensesSection = document.getElementById('expense-container');
        expensesSection.innerHTML = "";
        expensesSection.append(generateTableUI(0, expenses, responseData.currency, 0));

        // Check to see if an 'upcoming expenses' section is needed
        const upcomingTable = generateTableUI(0, expenses, responseData.currency, 1)
        if (!upcomingTable.classList.contains('empty-table')) {
            document.getElementById('upcoming-expenses').style.display = "grid";

            const upcomingExpenses = document.getElementById('upcoming-expense-container');
            upcomingExpenses.innerHTML = "";
            upcomingExpenses.append(upcomingTable);        
        } else {
            document.getElementById('upcoming-expenses').style.display = "none";
        }

        // Activate Carousel dots
        changeActiveDot(slideNum, "details-chart-dots");
    });
}

function setViewDates(startDate, period) {
    startDate = getUTCDateFromString(startDate);

    if (period == 0) {
        viewEnd = calculateEndDate(startDate, 2);
        viewStart = getUTCDateFromString(configureFilterDate(startDate, 2));
    } else if (period == 1 || period == 2) {
        viewEnd = calculateEndDate(startDate, 2);

        var tempStart = getUTCDateFromString(configureFilterDate(startDate, 2));
        viewStart = new Date(tempStart.setDate(tempStart.getDate() - 28))
    } else if (period == 3) {
        viewEnd = calculateEndDate(startDate, 4);
        viewStart = getUTCDateFromString(configureFilterDate(startDate, 4));
    } else if (period == 4) {
        viewEnd = calculateEndDate(startDate, 4);

        var tempStart = getUTCDateFromString(configureFilterDate(startDate, 4));
        viewStart = new Date(tempStart.setFullYear(tempStart.getFullYear() - 4))
    }
}

function dashboardBudgetAction() {
    window.location.assign("/dashboard?refresh=false&tab=budgets");
}

function createExpenseLink() {
    window.location.href = "/form/create-expense";
}

function createOptionsPanel(id) {
    document.getElementById("edit-div").addEventListener('click', function() {
        const dateString = String(document.getElementById("viewing-start-date").value);
        window.location = "/form/update-budget?id=" + id + "&duplicate=False&date=" + dateString;
    })

    document.getElementById("copy-div").addEventListener('click', function() {
        window.location = "/form/update-budget?id=" + id + "&duplicate=True";
    })

    document.getElementById("options-icon-toggle").addEventListener('click', (event) => {
        optionsToggle(event.target, document.getElementById("options-panel"));
    }, false);
}

function generateVariousCharts(items, slideNum, maxShow) {
    Chart.defaults.plugins.legend.display = false;
    Chart.defaults.color = COLORS_GREY;
    Chart.defaults.font.weight = 400;
    Chart.defaults.font.size = 15;
    Chart.defaults.plugins.tooltip.titleColor = COLORS_LIGHT;
    var description = "";

    if (slideNum == 0) {
        const donutChart = document.createElement('canvas');
        const data = items[0];
        description = data.description;

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
                        text: user_currency + formatNumber(data.dataText[0]) + " " + user_currency + formatNumber(data.dataText[1]),
                        color: COLORS_LIGHT,
                        minFontSize: 14, // Default is 20 (in px), set to false and text will not wrap.
                        lineHeight: 25 // Default is 25 (in px), used for when text wraps
                    }
                },
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                    tooltip: {
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                let dataObject = context.dataset;
                                return user_currency + formatNumber(dataObject.data[context.dataIndex]);
                            },
                            labelTextColor: function(context) {
                                return COLORS_LIGHT;
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
        returnDiv.dataset.slideNum = slideNum;
        returnDiv.classList.add('vertical-container', 'doughnut');
        returnDiv.append(donutHeader, fullchart1);
        return returnDiv;
    } else if (slideNum == 1) {
        const lineChart = document.createElement('canvas');
        const data = items[1];
        description = data.description;

        new Chart(lineChart, {
            type: "line",
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.data,
                    backgroundColor: COLORS_DARK,
                    borderColor: COLORS_GREEN,
                    pointBackgroundColor: COLORS_GREEN,
                    pointHoverBackgroundColor: COLORS_DARK,
                    borderWidth: 2.5,
                    tooltipText: "Current Amount",
                    pointRadius: 1.5,
                    pointHitRadius: 8,
                }, {
                    data: data.dataGrey,
                    backgroundColor: COLORS_DARK,
                    borderColor: COLORS_GREY,
                    pointBackgroundColor: COLORS_GREY,
                    pointHoverBackgroundColor: COLORS_DARK,
                    borderWidth: 2,
                    tooltipText: "Total Expected Amount",
                    pointRadius: 1.5,
                    pointHitRadius: 8,
                }],
            },
            options: {
                hover:{
                    mode: 'nearest'
                },
                plugins: {
                    title: {
                        display: true,
                        text: data.descriptionDates,
                        color: COLORS_GREY,
                        font: {
                            size: 15,
                            weight: 400
                        },
                    },
                    tooltip: {
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                let dataObject = context.dataset;
                                return dataObject.tooltipText + ": " + user_currency + formatNumber(dataObject.data[context.dataIndex]);
                            },
                            labelTextColor: function(context) {
                                return COLORS_LIGHT;
                            }
                        }
                    }
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
                        beginAtZero: true,
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
                                weight: 400
                            },
                            display: true,
                            text: "Amount ( " + user_currency + " )"
                        }
                    }
                },
                tooltips: {
                    callbacks: {
                        label: function(tooltipItems, data) {
                            return user_currency + formatNumber(tooltipItems.yLabel.toString());
                        }
                    }
                }
            }
        });

        const fullchart2 = document.createElement("div");
        fullchart2.classList.add("full-size-chart");
        fullchart2.append(lineChart);

        const lineHeader = document.createElement("p");
        lineHeader.textContent = description;
        const returnDiv = document.createElement('div');
        returnDiv.id = 'limited-charts';
        returnDiv.dataset.slideNum = slideNum;
        returnDiv.classList.add('vertical-container');
        returnDiv.append(lineHeader, fullchart2);
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

    endDate.innerText = calculateEndDate(startDate, period).toLocaleDateString({ timeZone: 'UTC' });
}

function updateQuickStat(summary, message) {
    const statSummary = document.getElementById('stat-summary');
    statSummary.innerText = summary;
    const quickStat = document.getElementById('quick-stat');
    quickStat.innerText = message;
}

function allChartDataAsArray(budget, startDate) {
    var toReturn = [];
    toReturn.push(budgetUsedAmount(budget), budgetUsePerPeriod(budget.budgetPeriod, startDate));
    return toReturn;
}

function budgetUsedAmount(budget) {
    const availableAmount = parseFloat((budget.amount).toFixed(2));
    const currentUsedAmount = parseFloat((budget.usedAmount).toFixed(2));
    const totalUsedAmount = parseFloat((budget.totalUsedAmount).toFixed(2));

    const amountRemaining = parseFloat((Math.abs(availableAmount - totalUsedAmount)).toFixed(2))

    if (totalUsedAmount > availableAmount) { // The user has overspent in their budget
        if (currentUsedAmount <= availableAmount) {
            updateQuickStat(
                "You are currently within budget, but an upcoming expense will put you over " + user_currency + String(formatNumber(amountRemaining)) + ".", 
                "Keep this in mind while making plans and consider making some changes to your upcoming expenses."
            )
        } else {
            updateQuickStat(
                "You are over budget by " + String(user_currency) + String(formatNumber(amountRemaining)) + "!",
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
                "You have " + String(user_currency) + String(formatNumber(amountRemaining)) + " left in this budget. Don't forget to take into account your upcoming expenses."
            )
        }
        const colors = [COLORS_GREEN, COLORS_GREY, COLORS_NAVY];
        const labels = ["Amount Used", "Upcoming Expenses", "Amount Left"]
        const data = [
            currentUsedAmount, 
            parseFloat((totalUsedAmount - currentUsedAmount).toFixed(2)), //How much is upcoming
            parseFloat((availableAmount - totalUsedAmount).toFixed(2)) // How much is remaining after upcoming expenses
        ];

        return { "data": data, "colors": colors, "labels": labels, "dataText": [totalUsedAmount, availableAmount], "description": "Budget Amount Used" };
    }
}

function budgetUsePerPeriod(period, startDate) {
    const keys = Object.keys(fullExpenseDict);
    var data = null;
    var dataGrey = null;
    var description = "Expenses Per Budget Period";
    var descriptionDates = "";
    const formattingOptions = getShortDateFormattingOptions(true);

    // First get the date ranges for the line graph
    if (period == 0) { // Daily
        data = getEmptySevenDaysMap(startDate);
        dataGrey = [...data.values];

        // Set the dates to be used as a chart title
        const firstDate = data.ranges[0].startDate;
        const lastDate = data.ranges[6].endDate;
        descriptionDates = firstDate.toLocaleDateString("en-us", formattingOptions) + " - " + lastDate.toLocaleDateString("en-us", formattingOptions);
    } else if (period == 1 || period == 2) { // Weekly or Biweekly
        data = getEmptyFourWeeksMap(startDate);
        dataGrey = [...data.values];

        // Set the dates to be used as a chart title
        const firstDate = data.ranges[0].startDate;
        const lastDate = data.ranges[3].endDate;
        descriptionDates = firstDate.toLocaleDateString("en-us", formattingOptions) + " - " + lastDate.toLocaleDateString("en-us", formattingOptions);
    } else if (period == 3) { // Monthly
        data = getEmptyMonthMap();
        dataGrey = [...data.values];
        if (!(startDate instanceof Date)) {
            descriptionDates = getUTCDateFromString(startDate).getFullYear();
        } else {
            descriptionDates = startDate.getFullYear();
        }
    } else if (period == 4) { // Yearly
        data = getEmptyFiveYearsMap(startDate);
        dataGrey = [...data.values];

        // Set the dates to be used as a chart title
        const firstDate = data.ranges[0].startDate;
        const lastDate = data.ranges[4].endDate;
        descriptionDates = firstDate.getFullYear() + " - " + lastDate.getFullYear();
    }

    // Calculate the data values for the line graph by adding up the amounts of each expense in each period
    for (const key of keys) {
        const amount = fullExpenseDict[key].data.amount;
        const dates = fullExpenseDict[key].allDates;
        
        for (const date of dates) {
            const localDate = new Date(date);
            var curDate = new Date(localDate.getUTCFullYear(), localDate.getUTCMonth(), localDate.getUTCDate());
            const todayDate = new Date().setHours(0,0,0,0);

            if (period == 3) {
                const curMonth = curDate.getMonth();

                if (curDate <= todayDate) {
                    data.values[curMonth] = parseFloat((data.values[curMonth] + amount).toFixed(2));
                }
                    
                dataGrey[curMonth] = parseFloat((dataGrey[curMonth] + amount).toFixed(2));
            } else {
                const index = getIndexOfRanges(curDate, data.ranges)

                if (index < 0) {
                    continue;
                }

                if (curDate <= todayDate) {
                    data.values[index] = parseFloat((data.values[index] + amount).toFixed(2));
                }

                dataGrey[index] = parseFloat((dataGrey[index] + amount).toFixed(2));
            }
        }
    }

    return { "data": data.values, "dataGrey": dataGrey, "labels": data.labels, "description": description, "descriptionDates": descriptionDates };
}

// Plugin credited to stackoverflow users: https://stackoverflow.com/questions/20966817/how-to-add-text-inside-the-doughnut-chart-using-chart-js
const doughnutText = {
    id: 'doughnut-centertext',
    beforeDraw: function(chart) {
        if (chart.config.options.elements.hasOwnProperty("center")) {
            // Get ctx from string
            var ctx = chart.ctx;
            ctx.save();

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
            var wrapText = true;

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
            ctx.font = "300 " + fontSizeToUse + "px " + fontStyle;
            ctx.fillStyle = color;

            if (!wrapText) {
                ctx.fillText(txt, centerX, centerY);
                return;
            }

            const words = txt.split(' ');
            const lineMetrics = ctx.measureText(words[0]);
            const lineHeight = lineMetrics.actualBoundingBoxAscent + lineMetrics.actualBoundingBoxDescent;
            
            // Top value
            ctx.fillText(words[0], centerX, centerY - lineHeight);

            // Bottom value
            ctx.fillText(words[1], centerX, centerY + lineHeight);

            const width1 = ctx.measureText(words[0]).width;
            const width2 = ctx.measureText(words[1]).width;
            const textWidth = (Math.max(width1, width2) + 15) / 2;
            const chartCenterX = chart.width / 2;
            const chartCenterY = chart.height / 2;

            // Fraction bar
            ctx.beginPath();
            ctx.strokeStyle = COLORS_LIGHT;
            ctx.lineWidth = 2;
            ctx.moveTo(chartCenterX - textWidth, chartCenterY);
            ctx.lineTo(chartCenterX + textWidth, chartCenterY);
            ctx.stroke();
            ctx.restore();
        }
    }
};