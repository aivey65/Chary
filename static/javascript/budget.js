const PERIODS = ["Daily", "Weekly", "Biweekly", "Monthly", "Yearly"];
const options = getDateFormattingOptions();
var user_currency = null;

function loadBudget(id) {
    fillProfilePics(); // Get the profile images on the page filled.

    fetch('/data/budget-expenses?id=' + id).then(response => response.json()).then((responseData) => {
        const budget = responseData.budget;
        const expenses = responseData.expenses;
        user_currency = responseData.currency;

        // Configure data for creating all charts
        const chartContainer = document.getElementById('details-chart-container');
        chartContainer.innerHTML = "";

        const chartData = allChartDataAsArray(budget, expenses);
        const currentChart = generateVariousCharts(chartData, 0, 1);
        chartContainer.append(currentChart);
        
        const dotCarousel = carouselButtons(chartData, "details-chart-dots", "details-chart-container", 1, generateVariousCharts);
        chartContainer.append(dotCarousel);
        
        document.getElementById('details-name').textContent = budget.name;
        document.getElementById('fraction-top').textContent = responseData.currency + formatNumber(budget.usedAmount);
        document.getElementById('fraction-bottom').textContent = responseData.currency + formatNumber(budget.amount);
        
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
            document.getElementById('recur-description').textContent = "This budget recurs " + period;
        }

        // Create 'expenses' section
        document.getElementById('expense-container').append(generateTableUI(0, expenses, responseData.currency));

        // Hide placeholders
        hidePlaceholders();
    });
}

function dashboardBudgetAction() {
    window.location.assign("/dashboard?refresh=false&tab=budgets");
}

function generateVariousCharts(items, slideNum, maxShow) {
    // Chart.defaults.global.legend.display = false;

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
            options: {
                maintainAspectRatio: false,
                tooltips: {
                    callbacks: {
                        label: function(tooltipItems, data) {
                            return data.labels[tooltipItems.index].toString() + ": " + user_currency + data.datasets[0].data[tooltipItems.index].toString();
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
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            maxTicksLimit: 5
                        },
                        scaleLabel: {
                            display: true,
                            labelString: "Amount (" + userData.currency + ")"
                        }
                    }]
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

function allChartDataAsArray(budget, expenses) {
    var toReturn = [];
    toReturn.push(budgetUsedAmount(budget), budgetUsePerPeriod(budget.period, expenses));
    return toReturn;
}

function budgetUsedAmount(budget) {
    // TODO: handle when a user is over budget with different colors??
    const colors = [COLORS_GREEN, COLORS_NAVY];
    const data = [parseFloat((budget.usedAmount).toFixed(2)), parseFloat((budget.amount - budget.usedAmount).toFixed(2))];
    const labels = ["Amount Used", "Amount Left"]

    return { "data": data, "colors": colors, "labels": labels };
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