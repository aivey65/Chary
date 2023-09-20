var userData = null;
const PERIODS = ["Daily", "Weekly", "Biweekly", "Monthly", "Yearly"]

// Function gets called everytime the dashboard is visited or refreshed
async function loadDashboard(refresh="false", tab="overview") {
    // Determine if local storage needs to be changed or not
    if (refresh == "true" || userData == null) {
        const response = updateUserData();
        response.then(() => {
            fillProfilePics(userData.profileImage);
            addHorizontalScrollShadow();
            document.getElementById("dashboard-tabs").style.display = "block";
             
            if (tab == "overview") {
                loadOverviewTab();
            } else if (tab == "budgets") {
                loadBudgetTab();
            } else if (tab == "expenses") {
                loadExpenseTab();
            } else if (tab == "earnings") {
                loadEarningTab();
            }
        });
    } else {
        if (tab == "overview") {
            loadOverviewTab();
        } else if (tab == "budgets") {
            loadBudgetTab();
        } else if (tab == "expenses") {
            loadExpenseTab();
        } else if (tab == "earnings") {
            loadEarningTab();
        }
    }
    history.replaceState(null, "", "/dashboard");
}

// Refresh boolean should be set to true when there is already user data saved, but it
// needs to be updated.
async function updateUserData() {
    const targetDate = new Date().toLocaleDateString("en-CA", {timeZone:"UTC"})

    const response = await fetch('/data/all-current?period=3&target=' + targetDate).then(response => response.json()).then((responseData) => {
        userData = responseData.data;
    });
    return response;
}

function updateData(type, period, date) {
    fetch('/data/' + type + '?period=' + period + '&target=' + date).then(response => response.json()).then((responseData) => {        
        if (type == 'budgets') {
            budgetContainer = document.getElementById("budget-container");
            budgetContainer.innerHTML = "";
            budgetContainer.append(generateBudgetsUI(responseData.data, userData.currency));
        } else if (type == 'expenses') {
            expenseContainer = document.getElementById("expense-container");
            expenseContainer.innerHTML = "";
            expenseContainer.append(generateTableUI(0, responseData.expenses, userData.currency));
        } else if (type == 'earnings') {
            earningContainer = document.getElementById("earning-container");
            earningContainer.innerHTML = "";
            earningContainer.append(generateTableUI(1, responseData, userData.currency));        }
    });
}

function loadOverviewTab() {
    const overviewTab = document.createElement('div');
    overviewTab.id = 'overview-section';

    const tabBody = document.getElementById('dashboard-main');
    tabBody.innerHTML = "";
    tabBody.append(overviewTab);

    const chartPanel = generateOverviewCharts();
    chartPanel.classList.add('module');
    overviewTab.append(chartPanel);

    const budgetPanel = generateOverviewBudgets(userData.budgets)
    budgetPanel.classList.add('module');
    overviewTab.append(budgetPanel);

    const profilePanel = generateOverviewProfile();
    profilePanel.classList.add('module');
    overviewTab.append(profilePanel);

    const earningPanel = generateOverviewEarnings();
    earningPanel.classList.add('module');
    overviewTab.append(earningPanel);

    const expensePanel = generateOverviewExpenses();
    expensePanel.classList.add('module');
    overviewTab.append(expensePanel);

    changeActiveTab(document.getElementById('overview-tab'));
    changeActiveDot(0, "overview-budget-dots");
    changeActiveDot(0, "overview-chart-dots");
}

function loadBudgetTab(budgets=userData.budgets) {
    const header = document.createElement('h1');
    header.id = 'tab-header';    
    header.textContent = "Budgets";

    const addButton = document.createElement('button');
    addButton.onclick = goToBudgetForm;
    addButton.id = "add-budget-button";
    addButton.classList.add("add-icon");
    const addIcon = document.createElement("img");
    addIcon.src = "../static/images/PlusIcon.svg";
    addIcon.alt = "Add icon";
    addButton.append(addIcon);

    const filterSection = createFiltersSection('budgets');
    filterSection.style.display = "flex";

    const filterIcon = document.createElement("img");
    filterIcon.title = "Hide";
    filterIcon.addEventListener("click", () => {
        if (filterSection.style.display == "none") {
            filterSection.style.display = "flex";
            filterIcon.title = "Hide";
        } else {
            filterSection.style.display = "none";
            filterIcon.title = "Show";
        }
    });
    filterIcon.src = "../static/images/FilterIcon.svg";
    filterIcon.classList.add("filter-img", "icon");
    filterIcon.alt = "Filter icon";

    const filterContainer = document.createElement("div");
    filterContainer.id = "filter-container";
    filterContainer.append(filterIcon, filterSection);

    const tabHead = document.createElement('div');
    tabHead.append(header, addButton, filterContainer);
    tabHead.id = 'tab-head';

    budgetContainer = generateBudgetsUI(budgets, userData.currency);

    const budgetTab = document.createElement('div');
    budgetTab.id = 'budget-section';
    budgetTab.append(tabHead, budgetContainer)

    const tabBody = document.getElementById('dashboard-main');
    tabBody.innerHTML = "";
    tabBody.append(budgetTab);

    changeActiveTab(document.getElementById('budget-tab'));
}

function loadEarningTab(earnings=userData.earnings) {
    const header = document.createElement('h1');
    header.id = 'tab-header';
    header.textContent = "Earnings";

    const addButton = document.createElement('button');
    addButton.onclick = goToEarningForm;
    addButton.id = "add-earning-button";
    addButton.classList.add("add-icon");
    const addIcon = document.createElement("img");
    addIcon.src="../static/images/PlusIcon.svg";
    addIcon.alt = "Add icon";
    addButton.append(addIcon);

    const filterSection = createFiltersSection('earnings');
    filterSection.style.display = "flex";

    const filterIcon = document.createElement("img");
    filterIcon.title = "Hide";
    filterIcon.addEventListener("click", () => {
        if (filterSection.style.display == "none") {
            filterSection.style.display = "flex";
            filterIcon.title = "Hide";
        } else {
            filterSection.style.display = "none";
            filterIcon.title = "Show";
        }
    });
    filterIcon.src = "../static/images/FilterIcon.svg";
    filterIcon.classList.add("filter-img", "icon");
    filterIcon.alt = "Filter icon";

    const filterContainer = document.createElement("div");
    filterContainer.id = "filter-container";
    filterContainer.append(filterIcon, filterSection);

    const tabHead = document.createElement('div');
    tabHead.append(header, addButton, filterContainer);
    tabHead.id = 'tab-head';

    table = generateTableUI(1, earnings, userData.currency);

    const earningContainer = document.createElement('div');
    earningContainer.id = 'earning-container';
    earningContainer.classList.add('tab-container');
    earningContainer.append(table);

    const earningTab = document.createElement('div');
    earningTab.id = 'earning-section';
    earningTab.append(tabHead, earningContainer)

    const tabBody = document.getElementById('dashboard-main');
    tabBody.innerHTML = "";
    tabBody.append(earningTab);

    changeActiveTab(document.getElementById('earning-tab'));
}

function loadExpenseTab(expenses=userData.expenses) {
    const header = document.createElement('h1');
    header.id = 'tab-header';
    header.textContent = "Expenses";

    const addButton = document.createElement('button');
    addButton.onclick = goToExpenseForm;
    addButton.id = 'add-expense-button';
    addButton.classList.add("add-icon");
    const addIcon = document.createElement("img");
    addIcon.src="../static/images/PlusIcon.svg";
    addIcon.alt = "Add icon";
    addButton.append(addIcon);

    const filterSection = createFiltersSection('expenses');
    filterSection.style.display = "flex";

    const filterIcon = document.createElement("img");
    filterIcon.title = "Hide";
    filterIcon.addEventListener("click", () => {
        if (filterSection.style.display == "none") {
            filterSection.style.display = "flex";
            filterIcon.title = "Hide";
        } else {
            filterSection.style.display = "none";
            filterIcon.title = "Show";
        }
    });
    filterIcon.src = "../static/images/FilterIcon.svg";
    filterIcon.classList.add("filter-img", "icon");
    filterIcon.alt = "Filter icon";

    const filterContainer = document.createElement("div");
    filterContainer.id = "filter-container";
    filterContainer.append(filterIcon, filterSection);

    const tabHead = document.createElement('div');
    tabHead.append(header, addButton, filterContainer);
    tabHead.id = 'tab-head';

    const table = generateTableUI(0, expenses.expenses, userData.currency);

    const expenseContainer = document.createElement('div');
    expenseContainer.id = 'expense-container';
    expenseContainer.classList.add('tab-container');
    expenseContainer.append(table);

    const expenseTab = document.createElement('div');
    expenseTab.id = 'expense-section';
    expenseTab.append(tabHead, expenseContainer)

    const tabBody = document.getElementById('dashboard-main');
    tabBody.innerHTML = "";
    tabBody.append(expenseTab);

    changeActiveTab(document.getElementById('expense-tab'));
}

function goToProfile() {
    window.location.href = "/profile"
}

function goToBudgetForm() {
    window.location.href = "/form/create-budget";
}

function goToEarningForm() {
    window.location.href = "/form/create-earning";
}

function goToExpenseForm() {
    window.location.href = "/form/create-expense";
}

function changeActiveTab(newActiveTab) {
    // Update which tab is active
    const tabs = document.getElementsByClassName('dashTab');
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove('active');
    }

    newActiveTab.classList.add('active');
}

function addHorizontalScrollShadow() {
    const parent = document.getElementById('dashboard-tabs');
    const child = parent.getElementsByTagName('ul')[0];
    sideScrollShadow(parent, child);
    
    child.addEventListener('scroll', () => {
        sideScrollShadow(parent, child);
    });
}

////////////////////////////
// Data Loading Functions //
////////////////////////////

function generateOverviewCharts() {
    const overviewChartContainer = document.createElement('div');
    overviewChartContainer.id = 'chart-snip-container';
    overviewChartContainer.classList.add('snip-containers');

    // Configure data for creating all charts
    const chartData = allChartDataAsArray();
    const currentChart = generateVariousCharts(chartData, 0, 1);

    const chartContainer = document.createElement("div");
    chartContainer.id = "chart-container";
    chartContainer.append(currentChart);
    overviewChartContainer.append(chartContainer);
    
    const dotCarousel = carouselButtons(chartData, "overview-chart-dots", "chart-container", 1, generateVariousCharts);
    overviewChartContainer.append(dotCarousel);

    return overviewChartContainer;
}

function generateOverviewProfile() {
    const overviewProfileContainer = document.createElement('div');
    overviewProfileContainer.id = 'profile-snip-container';
    overviewProfileContainer.classList.add('snip-containers');

    const overviewHeader = document.createElement('h3');
    overviewHeader.textContent = "Profile";
    overviewHeader.classList.add('module-header');
    overviewProfileContainer.append(overviewHeader);
    
    const profileComponents = generateProfileUI(userData.balance, userData.username, userData.email, userData.profileColor, userData.profileImage, userData.currency);
    overviewProfileContainer.append(profileComponents);

    return overviewProfileContainer;
}

function generateOverviewBudgets(budgets) {
    const overviewBudgetContainer = document.createElement("div");
    overviewBudgetContainer.id = 'budget-snip-container';
    overviewBudgetContainer.classList.add('snip-containers');

    const overviewHeader = document.createElement('h3');
    overviewHeader.textContent = "Budget Information";
    overviewHeader.classList.add('module-header');
    overviewBudgetContainer.append(overviewHeader);

    const addButton = document.createElement('button');
    addButton.onclick = goToBudgetForm;
    addButton.id = "add-budget-button";
    addButton.classList.add("add-icon");
    const addIcon = document.createElement("img");
    addIcon.src = "../static/images/PlusIcon.svg";
    addIcon.alt = "Add icon";
    addButton.append(addIcon);
    overviewBudgetContainer.append(addButton);

    const limitedBudgetsContainer = document.createElement("div");
    limitedBudgetsContainer.id = "limited-budgets-container";
    limitedBudgetsContainer.append(generateLimitedOverviewBudgets(budgets, 0, 3));
    overviewBudgetContainer.append(limitedBudgetsContainer);
    
    const dotCarousel = carouselButtons(budgets, "overview-budget-dots", "limited-budgets-container", 3, generateLimitedOverviewBudgets);
    overviewBudgetContainer.append(dotCarousel);

    return overviewBudgetContainer;
}

function generateVariousCharts(items, slideNum, maxShow) {
    Chart.defaults.global.legend.display = false;

    if (slideNum == 0) {
        // First create a 'total' chart to show the expected budget amounts
        const totalChart = document.createElement('canvas');
        const dataExpected = items[0].total;
        let expectedSum = items[0].totalSum;

        new Chart(totalChart, {
            type: "pie",
            data: {
                labels: dataExpected.map(row => row.budgetName),
                datasets: [{
                    label: "Total Budget Amount",
                    data: dataExpected.map(row => row.amount),
                    backgroundColor: dataExpected.map(row => row.color),
                    borderColor: COLORS_NAVY,
                    borderWidth: 2.5,
                }],
            },
            options: {
                maintainAspectRatio: false,
                responsive: true,
                tooltips: {
                    callbacks: {
                        label: function(tooltipItems, data) {
                            let dataArray = data.datasets[0].data;
                            let textArray = data.labels;
                            return textArray[tooltipItems.index] + ": " + userData.currency + dataArray[tooltipItems.index];
                        }
                    }
                }
            }
        });
        const halfchart1 = document.createElement("div");
        halfchart1.classList.add("half-size-chart");
        halfchart1.append(totalChart);

        const totalHeader = document.createElement("p");
        totalHeader.textContent = "Total Amount Budgeted";
        const totalnumber = document.createElement("p");
        totalnumber.classList.add("chart-number");
        totalnumber.textContent = userData.currency + expectedSum;
        const totalChartContainer = document.createElement("div");
        totalChartContainer.append(totalHeader, totalnumber, halfchart1);
        totalChartContainer.classList.add("half-size");

        // Create an 'actual' chart to show the current amount spent of each budget
        const actualChart = document.createElement('canvas');
        const dataActual = items[0].actual;
        let actualSum = items[0].actualSum;

        new Chart(actualChart, {
            type: "pie",
            data: {
                labels: dataActual.map(row => row.budgetName),
                datasets: [{
                    data: dataActual.map(row => row.amount),
                    backgroundColor: dataActual.map(row => row.color),
                    borderColor: COLORS_NAVY,
                    borderWidth: 2.5,
                }],
            },
            options: {
                maintainAspectRatio: false,
                responsive: true,
                tooltips: {
                    callbacks: {
                        label: function(tooltipItems, data) {
                            let dataArray = data.datasets[0].data;
                            let textArray = data.labels;
                            return textArray[tooltipItems.index] + ": " + userData.currency + dataArray[tooltipItems.index];
                        }
                    }
                }
            }
        });  
        const halfchart2 = document.createElement("div");
        halfchart2.classList.add("half-size-chart");
        halfchart2.append(actualChart);

        const actualHeader = document.createElement("p");
        actualHeader.textContent = "Actual Amount Used";
        const actualnumber = document.createElement("p");
        actualnumber.classList.add("chart-number");
        actualnumber.textContent = userData.currency + actualSum;
        const actualChartContainer = document.createElement("div");
        actualChartContainer.append(actualHeader, actualnumber, halfchart2);
        actualChartContainer.classList.add("half-size");
        
        const returnDiv = document.createElement('div');
        returnDiv.id = 'limited-charts';
        returnDiv.classList.add('horizontal-container');
        returnDiv.append(totalChartContainer, actualChartContainer);
        return returnDiv;
    } else if (slideNum == 1) {
        const expenseChart = document.createElement('canvas');
        const data = items[1];

        new Chart(expenseChart, {
            type: "bar",
            data: {
                labels: data.labels,
                datasets: [{
                    label: "Amount (" + userData.currency + ")",
                    data: data.values,
                    backgroundColor: COLORS_GREEN,
                }],
            },
            options: {
                title: {
                    display: true,
                    text: "",
                    class: "chart-title"
                },
                maintainAspectRatio: false,
                responsive: true,
                scales: {
                    xAxes: [{
                        gridLines: {
                            color: COLORS_NAVY,
                        },
                        ticks: {
                            fontColor: COLORS_GREY
                        }
                    }],
                    yAxes: [{
                        gridLines: {
                            color: COLORS_NAVY,
                        },
                        ticks: {
                            fontColor: COLORS_GREY,
                            beginAtZero: true,
                            maxTicksLimit: 5,
                            callback: function(value, index, values) {
                                return formatNumber(value);
                            }
                        },
                        scaleLabel: {
                            fontColor: COLORS_GREY,
                            display: true,
                            labelString: "Amount (" + userData.currency + ")"
                        }
                    }]
                },
                tooltips: {
                    callbacks: {
                        label: function(tooltipItems, data) {
                            return userData.currency + tooltipItems.yLabel.toString();
                        }
                    }
                }
            }
        });
        const fullchart1 = document.createElement("div");
        fullchart1.classList.add("full-size-chart");
        fullchart1.append(expenseChart);

        const expenseHeader = document.createElement("p");
        expenseHeader.textContent = "Expenses per Month";
        const returnDiv = document.createElement('div');
        returnDiv.id = 'limited-charts';
        returnDiv.classList.add('vertical-container');
        returnDiv.append(expenseHeader, fullchart1);
        return returnDiv;
    } else if (slideNum == 2) {
        const earningChart = document.createElement('canvas');
        const data = items[2];

        new Chart(earningChart, {
            type: "bar",
            data: {
                labels: data.labels,
                datasets: [{
                    label: "Amount (" + userData.currency + ")",
                    data: data.values,
                    backgroundColor: COLORS_GREEN,
                }],
            },
            options: {
                title: {
                    display: true,
                    text: "",
                    class: "chart-title"
                },
                maintainAspectRatio: false,
                scales: {
                    xAxes: [{
                        gridLines: {
                            color: COLORS_NAVY
                        },
                        ticks: {
                            fontColor: COLORS_GREY
                        }
                    }],
                    yAxes: [{
                        gridLines: {
                            color: COLORS_NAVY
                        },
                        ticks: {
                            fontColor: COLORS_GREY,
                            beginAtZero: true,
                            maxTicksLimit: 5,
                            callback: function(value, index, values) {
                                return formatNumber(value);
                            }
                        },
                        scaleLabel: {
                            fontColor: COLORS_GREY,
                            display: true,
                            labelString: "Amount (" + userData.currency + ")"
                        }
                    }]
                },
                tooltips: {
                    callbacks: {
                        label: function(tooltipItems, data) {
                            return userData.currency + tooltipItems.yLabel.toString();
                        }
                    }
                }
            }
        });
        const fullchart2 = document.createElement("div");
        fullchart2.classList.add("full-size-chart");
        fullchart2.append(earningChart);

        earningHeader = document.createElement("p");
        earningHeader.textContent = "Earnings per Month";
        const returnDiv = document.createElement('div');
        returnDiv.id = 'limited-charts';
        returnDiv.classList.add('vertical-container');
        returnDiv.append(earningHeader, fullchart2);
        return returnDiv;
    }
}

function generateLimitedOverviewBudgets(budgetList, slideNum, maxShow) {
    const budgetContainer = document.createElement("div");
    budgetContainer.id = 'limited-budgets';

    const keys = Object.keys(budgetList)
    const start = slideNum * maxShow;

    for (var index = 0; index < keys.length; index++) {
        if (index >= start && index < start + maxShow) {
            const key = keys[index]
            const budget = budgetList[key];

            const budgetSnippet = document.createElement('div');
            budgetSnippet.classList.add('budget-snippet');
            budgetSnippet.addEventListener('click', function(e) {
                if (!e.target.classList.contains('snip-edit')) {
                    window.location = "/expand-budget?id=" + key;
                }
            })

            var recur_img = null;
            if (budget.recurring) {
                recur_img = document.createElement('img');
                recur_img.src = 'static/images/recurIcon.svg';
                recur_img.classList.add('recur-img');
                const period = PERIODS[budget.budgetPeriod].toLocaleLowerCase();
                recur_img.title = "This budget recurs " + period + ".";
            }

            const budget_used = document.createElement('p');
            budget_used.classList.add('snip-budget-used');
            budget_used.textContent = (budget.usedAmount / budget.amount * 100).toFixed(1) + "% used";

            const budget_edit = document.createElement('img');
            budget_edit.src = "static/images/EditButtonSM.svg";
            budget_edit.title = "Edit";
            budget_edit.classList.add('snip-edit');
            budget_edit.addEventListener('click', function() {
                window.location = "/form/update-budget?id=" + key;
            })

            // Progess SVG
            const svgDiv = document.createElement('div');
            svgDiv.classList.add('snip-svg-div');

            const svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            const path1 = document.createElementNS("http://www.w3.org/2000/svg", 'line');
            const path2 = document.createElementNS("http://www.w3.org/2000/svg", 'line');

            svg.setAttribute('width', '200');
            svg.setAttribute('height', '20');
            svg.setAttribute('viewbox', '0 0 200 60');
            svg.classList.add('snip-progress-svg');
            svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");

            path1.setAttribute('x1', '10');
            path1.setAttribute('x2', '190');
            path1.setAttribute('y1', '10');
            path1.setAttribute('y2', '10');
            path1.classList.add('snip-outer-progress');
            path1.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
            svg.append(path1);
            
            const fillAmount = budget.usedAmount;
            if (fillAmount != 0) {
                path2.setAttribute('x1', '10');
                path2.setAttribute('x2', '190');
                path2.setAttribute('y1', '10');
                path2.setAttribute('y2', '10');
                path2.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
        
                path2Length = path2.getAttribute('x2') - path2.getAttribute('x1');
                path2.setAttribute('stroke-dasharray', (fillAmount/budget.amount) * path2Length + ' ' + path2Length);
                path2.classList.add('snip-inner-progress');

                svg.append(path1, path2);  
            }

            svgDiv.append(svg);

            const budget_name = document.createElement('p');
            budget_name.classList.add('snip-budget-name');
            budget_name.textContent = budget.name;

            const budget_main = document.createElement('div');
            budget_main.classList.add("snip-budget-main");
            budget_main.append(budget_name, svgDiv);

            // End progress svg

            budgetSnippet.append(recur_img, budget_main, budget_used, budget_edit);
            
            budgetContainer.append(budgetSnippet)
        }
    }

    return budgetContainer;
}

function generateOverviewExpenses() {
    const overviewExpenseContainer = document.createElement('div');
    overviewExpenseContainer.id = 'expense-snip-container';
    overviewExpenseContainer.classList.add('snip-containers');

    const overviewHeader = document.createElement('h3');
    overviewHeader.textContent = "Recent Expenses";
    overviewHeader.classList.add('module-header');

    const addButton = document.createElement('button');
    addButton.onclick = goToExpenseForm;
    addButton.id = 'add-expense-button';
    addButton.classList.add("add-icon");
    const addIcon = document.createElement("img");
    addIcon.src="../static/images/PlusIcon.svg";
    addIcon.alt = "Add icon";
    addButton.append(addIcon);

    const expenseTable = generateTableUI(0, userData.expenses.expenses, userData.currency, 5);

    overviewExpenseContainer.append(overviewHeader, addButton, expenseTable);
    return overviewExpenseContainer;
}

function generateOverviewEarnings() {
    const overviewEarningContainer = document.createElement('div');
    overviewEarningContainer.id = 'earning-snip-container';
    overviewEarningContainer.classList.add('snip-containers');

    const overviewHeader = document.createElement('h3');
    overviewHeader.textContent = "Recent Earnings";
    overviewHeader.classList.add('module-header');

    const addButton = document.createElement('button');
    addButton.onclick = goToEarningForm;
    addButton.id = "add-earning-button";
    addButton.classList.add("add-icon");
    const addIcon = document.createElement("img");
    addIcon.src="../static/images/PlusIcon.svg";
    addIcon.alt = "Add icon";
    addButton.append(addIcon);

    const earningTable = generateTableUI(1, userData.earnings, userData.currency, 5);

    overviewEarningContainer.append(overviewHeader, addButton, earningTable);
    return overviewEarningContainer;
}

///////////////////////////////////
// Chart Configurating Functions //
///////////////////////////////////
function allChartDataAsArray() {
    var toReturn = [];
    toReturn.push(totalBudgetsAndAmounts(), expensesPerMonth(), earningsPerMonth());
    return toReturn;
}

function totalBudgetsAndAmounts() {
    const budgetList = userData.budgets;
    const keys = Object.keys(budgetList);
    const colors = DATA_COLORS.sort(() => Math.random() - 0.5);
    const colorLength = colors.length;

    const totalData = [];
    var totalSum = 0;
    const actualData = [];
    var actualSum = 0;

    var index = 0;
    for (const key of keys) {
        var current = budgetList[key];

        var currName = current.name;
        currName = currName.length > 15 ? currName.substring(0, 15) + '...' : currName;

        totalData.push({ budgetName: currName, amount: current.amount, color: colors[index % colorLength] });
        totalSum += current.amount;

        actualData.push({ budgetName: currName, amount: current.usedAmount, color: colors[index % colorLength] });
        actualSum += current.usedAmount;

        index++;
    }

    // Round sums before adding the 'unused' amount
    totalSum = parseFloat(totalSum.toFixed(2));
    actualSum = parseFloat(actualSum.toFixed(2));

    if (actualSum < totalSum) {
        actualData.push({ budgetName: "Unused", amount: parseFloat((totalSum - actualSum).toFixed(2)), color: COLORS_NAVY });
    }

    totalData.sort((a, b) => {
        return a.amount - b.amount;
    })
    actualData.sort((a, b) => {
        return a.amount - b.amount;
    })

    return { "total": totalData, "actual": actualData, "totalSum": totalSum, "actualSum": actualSum };
}

function expensesPerMonth(currentYear) {
    const expenseList = userData.expenses.expenses;

    const keys = Object.keys(expenseList);
    const data = getEmptyMonthMap();

    for (const key of keys) {
        const amount = expenseList[key].data.amount
        const dates = expenseList[key].dates
        
        for (const date of dates) {
            const localDate = new Date(date);
            var curDate = new Date(localDate.getUTCFullYear(), localDate.getUTCMonth(), localDate.getUTCDate());
            const todayDate = new Date().setHours(0,0,0,0);

            if (curDate <= todayDate) {
                const curMonth = curDate.getMonth();
                data.values[curMonth] = data.values[curMonth] + amount;
            }
        }
    }

    return data;
}

function earningsPerMonth() {
    const earningList = userData.earnings;

    const keys = Object.keys(earningList);
    const data = getEmptyMonthMap();

    for (const key of keys) {
        const amount = earningList[key].data.amount
        const dates = earningList[key].dates
        
        for (const date of dates) {
            const localDate = new Date(date);
            var curDate = new Date(localDate.getUTCFullYear(), localDate.getUTCMonth(), localDate.getUTCDate());
            const todayDate = new Date().setHours(0,0,0,0);

            if (curDate <= todayDate) {
                const curMonth = curDate.getMonth();
                data.values[curMonth] = data.values[curMonth] + amount;
            }
        }
    }

    return data;
}