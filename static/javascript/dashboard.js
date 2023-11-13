var userData = null;
const PERIODS = ["Daily", "Weekly", "Biweekly", "Monthly", "Yearly"]
const DESCRIPTION_PERIODS = ["Day", "Week", "Week", "Month", "Year"]

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

    const response = await fetch('/data/all-current?period=4&target=' + targetDate).then(response => response.json()).then((responseData) => {
        userData = responseData.data;
    });
    return response;
}

function updateData(type, period, date, upcoming) {
    const currentYear = (new Date()).getFullYear();
    if ((type == 'expenses' || type == 'earnings') && period == 4 && date.split('-')[0] == String(currentYear)) {
        if (type == 'expenses') {
            expenseContainer = document.getElementById("expense-container");
            expenseContainer.innerHTML = "";
            expenseContainer.append(generateTableUI(0, userData.expenses.expenses, userData.currency, upcoming));
        } else if (type == 'earnings') {
            earningContainer = document.getElementById("earning-container");
            earningContainer.innerHTML = "";
            earningContainer.append(generateTableUI(1, userData.earnings, userData.currency, upcoming));        
        }
    } else if(type == 'charts') {
        // Save the slide number so that the current chart updates and stays in view
        const slideNum = document.getElementById("limited-charts").dataset.slideNum;
        console.log("slide nummmmm", slideNum)

        fetch('/data/all-current?period=' + period + '&target=' + date + '&chartData=True').then(response => response.json()).then((responseData) => {
            // Configure data for creating all charts
            console.log(responseData)

            const chartData = allChartDataAsArray(responseData.budgets, responseData.expenses.expenses, responseData.earnings, period, date);
            const currentChart = generateVariousCharts(chartData, slideNum, 1);

            const chartContainer = document.getElementById("chart-container");
            chartContainer.innerHTML = "";
            chartContainer.append(currentChart);
            
            const dotContainer = document.getElementById("dot-container");
            dotContainer.innerHTML = "";
            dotContainer.append(carouselButtons(chartData, "overview-chart-dots", "chart-container", 1, generateVariousCharts));
            
            changeActiveDot(slideNum, "overview-chart-dots");
        });
    } else {
        fetch('/data/' + type + '?period=' + period + '&target=' + date).then(response => response.json()).then((responseData) => {        
        if (type == 'budgets') {
            budgetContainer = document.getElementById("budget-container");
            budgetContainer.innerHTML = "";
            if (period == -1) {
                budgetContainer.append(generateBudgetsUI(responseData.data, userData.currency, new Date(date), true));
            } else {
                budgetContainer.append(generateBudgetsUI(responseData.data, userData.currency, new Date(date), false));
            }
        } else if (type == 'expenses') {
            expenseContainer = document.getElementById("expense-container");
            expenseContainer.innerHTML = "";
            expenseContainer.append(generateTableUI(0, responseData.expenses, userData.currency, upcoming));
        } else if (type == 'earnings') {
            earningContainer = document.getElementById("earning-container");
            earningContainer.innerHTML = "";
            earningContainer.append(generateTableUI(1, responseData, userData.currency, upcoming));        
        }
    });
    }
}

function loadOverviewTab() {
    const overviewTab = document.createElement('div');
    overviewTab.id = 'overview-section';

    const tabBody = document.getElementById('dashboard-main');
    tabBody.innerHTML = "";
    tabBody.append(overviewTab);

    // Scroll to top once the screen has cleared.
    window.scrollTo(0, 0);

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

    // Scroll to top once the screen has cleared.
    window.scrollTo(0, 0);

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

    table = generateTableUI(1, earnings, userData.currency, 0);

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

    // Scroll to top once the screen has cleared.
    window.scrollTo(0, 0);

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

    const table = generateTableUI(0, expenses.expenses, userData.currency, 0);

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

    // Scroll to top once the screen has cleared.
    window.scrollTo(0, 0);

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

    // Filter section for filtering the graph information
    const filterSection = createFiltersSection('charts');
    filterSection.style.display = "flex";
    filterSection.style.justifyContent = "center";
    overviewChartContainer.append(filterSection);

    // Configure data for creating all charts
    const chartData = allChartDataAsArray(userData.budgets, userData.expenses.expenses, userData.earnings, 3);
    const currentChart = generateVariousCharts(chartData, 0, 1);

    const chartContainer = document.createElement("div");
    chartContainer.id = "chart-container";
    chartContainer.append(currentChart);
    overviewChartContainer.append(chartContainer);
    
    const dotCarousel = carouselButtons(chartData, "overview-chart-dots", "chart-container", 1, generateVariousCharts);
    const dotContainer = document.createElement('div');
    dotContainer.id = "dot-container";
    dotContainer.append(dotCarousel);
    overviewChartContainer.append(dotContainer);

    return overviewChartContainer;
}

function generateOverviewProfile() {
    const overviewProfileContainer = document.createElement('div');
    overviewProfileContainer.id = 'profile-snip-container';
    overviewProfileContainer.classList.add('snip-containers');
    overviewProfileContainer.addEventListener('click', function(e) {
        if (!e.target.classList.contains("edit-img")) {
            window.location.href = "/profile";
        }
    })

    const overviewHeader = document.createElement('h3');
    overviewHeader.textContent = "Profile";
    overviewHeader.classList.add('module-header');
    overviewProfileContainer.append(overviewHeader);
    
    const profileComponents = generateProfileUI(userData.username, userData.email, userData.profileColor, userData.profileImage, userData.currency);
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
    overviewHeader.addEventListener('click', () => {
        loadBudgetTab();
    })
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
    Chart.defaults.plugins.legend.display = false;

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
                    label: "Budgeted Amount",
                    data: dataExpected.map(row => row.amount),
                    backgroundColor: dataExpected.map(row => row.color),
                    borderWidth: 1,
                    borderColor: COLORS_DARK
                }],
            },
            options: {
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let dataObject = context.dataset;
                                return dataObject.label + ": " + userData.currency + dataObject.data[context.dataIndex];
                            }
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
                    label: "Amount Used",
                    data: dataActual.map(row => row.amount),
                    backgroundColor: dataActual.map(row => row.color),
                    borderWidth: 1,
                    borderColor: COLORS_DARK
                }],
            },
            options: {                 
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let dataObject = context.dataset;
                                return dataObject.label + ": " + userData.currency + dataObject.data[context.dataIndex];
                            }
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
        returnDiv.dataset.slideNum = slideNum;
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
                    label: "Spent",
                    data: data.data,
                    backgroundColor: COLORS_GREEN,
                }, {
                    label: "Upcoming Expenses",
                    data: data.dataGrey,
                    backgroundColor: COLORS_GREY,
                }],
            },
            options: {
                maintainAspectRatio: false,
                responsive: true,
                scales: {
                    x: {
                        stacked: true,
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
                        stacked: true,
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
                            },
                            display: true,
                            text: "Amount ( " + userData.currency + " )"
                        }
                    }
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
                                return dataObject.label + ": " + userData.currency + dataObject.data[context.dataIndex];
                            }
                        }
                    }
                }
            }
        });
        const fullchart1 = document.createElement("div");
        fullchart1.classList.add("full-size-chart");
        fullchart1.append(expenseChart);

        const expenseHeader = document.createElement("p");
        expenseHeader.textContent = data.description;
        const returnDiv = document.createElement('div');
        returnDiv.id = 'limited-charts';
        returnDiv.dataset.slideNum = slideNum;
        returnDiv.classList.add('vertical-container');
        returnDiv.addEventListener('click', () => {
            loadExpenseTab();
        })
        returnDiv.append(expenseHeader, fullchart1);
        return returnDiv;
    } else if (slideNum == 2) {
        const earningChart = document.createElement('canvas');
        const data = items[2];
        console.log(data)

        new Chart(earningChart, {
            type: "bar",
            data: {
                labels: data.labels,
                datasets: [{
                    label: "Earned",
                    data: data.data,
                    backgroundColor: COLORS_GREEN,
                }, {
                    label: "Upcoming Earnings",
                    data: data.dataGrey,
                    backgroundColor: COLORS_GREY,
                }],
            },
            options: {
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true,
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
                        stacked: true,
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
                            },                            
                            display: true,
                            text: "Amount ( " + userData.currency + " )"
                        }
                    }
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
                                return dataObject.label + ": " + userData.currency + dataObject.data[context.dataIndex];
                            }
                        }
                    }
                }
            }
        });
        const fullchart2 = document.createElement("div");
        fullchart2.classList.add("full-size-chart");
        fullchart2.append(earningChart);

        earningHeader = document.createElement("p");
        earningHeader.textContent = data.description;
        const returnDiv = document.createElement('div');
        returnDiv.id = 'limited-charts';
        returnDiv.dataset.slideNum = slideNum;
        returnDiv.classList.add('vertical-container');
        returnDiv.addEventListener('click', () => {
            loadEarningTab();
        })
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
            const formatDateString = (new Date()).toLocaleDateString("en-CA", { timeZone: 'UTC' });
            const key = keys[index]
            const budget = budgetList[key];

            const budgetSnippet = document.createElement('div');
            budgetSnippet.classList.add('budget-snippet');
            budgetSnippet.addEventListener('click', function() {
                window.location = "/expand-budget?id=" + key + "&date=" + formatDateString + "&period=" + budget.budgetPeriod + "&inactive=False";
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

            const budget_more = document.createElement('img');
            budget_more.src = "static/images/MoreButtonsmall.svg";
            budget_more.title = "See More";
            budget_more.classList.add("more-img");
            budget_more.addEventListener('click', function() {
                window.location.href = "/expand-budget?id=" + key + "&date=" + formatDateString + "&period=" + budget.budgetPeriod + "&inactive=" + inactive;
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

            budgetSnippet.append(recur_img, budget_main, budget_used, budget_more);
            
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
    overviewHeader.addEventListener('click', () => {
        loadExpenseTab();
    })

    const addButton = document.createElement('button');
    addButton.onclick = goToExpenseForm;
    addButton.id = 'add-expense-button';
    addButton.classList.add("add-icon");
    const addIcon = document.createElement("img");
    addIcon.src="../static/images/PlusIcon.svg";
    addIcon.alt = "Add icon";
    addButton.append(addIcon);

    const expenseTable = generateTableUI(0, userData.expenses.expenses, userData.currency, 0, 5);

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
    overviewHeader.addEventListener('click', () => {
        loadEarningTab();
    })

    const addButton = document.createElement('button');
    addButton.onclick = goToEarningForm;
    addButton.id = "add-earning-button";
    addButton.classList.add("add-icon");
    const addIcon = document.createElement("img");
    addIcon.src="../static/images/PlusIcon.svg";
    addIcon.alt = "Add icon";
    addButton.append(addIcon);

    const earningTable = generateTableUI(1, userData.earnings, userData.currency, 0, 5);

    overviewEarningContainer.append(overviewHeader, addButton, earningTable);
    return overviewEarningContainer;
}

///////////////////////////////////
// Chart Configurating Functions //
///////////////////////////////////
function allChartDataAsArray(budgets, expenses, earnings, period=3, startDate=new Date()) {
    var toReturn = [];

    toReturn.push(totalBudgetsAndAmounts(budgets, period), expensesPerMonth(expenses, period, startDate), earningsPerMonth(earnings, period, startDate));
    return toReturn;
}

function totalBudgetsAndAmounts(budgetList, period) {
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

        if (current.budgetPeriod != period) {
            continue;
        }

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

function expensesPerMonth(expenseList, period=3, startDate) {
    console.log("period", period)
    console.log(period == 4)

    const keys = Object.keys(expenseList);
    var data = null;
    var dataGrey = null;

    var description = "Expenses Per " + DESCRIPTION_PERIODS[period];
    var descriptionDates = "";
    const formattingOptions = getShortDateFormattingOptions(true);

    if (period == 0) { // Daily
        data = getEmptySevenDaysMap(startDate);
        dataGrey = [...data.values];

        // Set the dates to be used as a chart title
        firstDate = data.ranges[0].startDate;
        lastDate = data.ranges[6].endDate;
        descriptionDates = firstDate.toLocaleDateString("en-us", formattingOptions) + " - " + lastDate.toLocaleDateString("en-us", formattingOptions);
    } else if (period == 1 || period == 2) { // Weekly or Biweekly
        data = getEmptyFourWeeksMap(startDate);
        dataGrey = [...data.values];

        // Set the dates to be used as a chart title
        firstDate = data.ranges[0].startDate;
        lastDate = data.ranges[3].endDate;
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
        firstDate = data.ranges[0].startDate;
        lastDate = data.ranges[4].endDate;
        descriptionDates = firstDate.getFullYear() + " - " + lastDate.getFullYear();
    }

    for (const key of keys) {
        const amount = expenseList[key].data.amount;
        const dates = expenseList[key].allDates;
        
        for (const date of dates) {
            const localDate = new Date(date);
            var curDate = new Date(localDate.getUTCFullYear(), localDate.getUTCMonth(), localDate.getUTCDate());
            const todayDate = new Date().setHours(0,0,0,0);

            if (period == 3) {
                const curMonth = curDate.getMonth();

                if (curDate <= todayDate) {
                    data.values[curMonth] = parseFloat((data.values[curMonth] + amount).toFixed(2));
                } else {
                    dataGrey[curMonth] = parseFloat((dataGrey[curMonth] + amount).toFixed(2));
                }
            } else {
                const index = getIndexOfRanges(curDate, data.ranges)

                if (index < 0) {
                    continue;
                }

                if (curDate <= todayDate) {
                    data.values[index] = parseFloat((data.values[index] + amount).toFixed(2));
                } else {
                    dataGrey[index] = parseFloat((dataGrey[index] + amount).toFixed(2));
                }
            }
        }
    }

    return { "data": data.values, "dataGrey": dataGrey, "labels": data.labels, "description": description, "descriptionDates": descriptionDates };
}

function earningsPerMonth(earningList, period=3, startDate) {
    const keys = Object.keys(earningList);
    var data = null;
    var dataGrey = null;

    var description = "Earnings Per " + DESCRIPTION_PERIODS[period];
    var descriptionDates = "";
    const formattingOptions = getShortDateFormattingOptions(true);

    if (period == 0) { // Daily
        data = getEmptySevenDaysMap(startDate);
        dataGrey = [...data.values];

        // Set the dates to be used as a chart title
        firstDate = data.ranges[0].startDate;
        lastDate = data.ranges[6].endDate;
        descriptionDates = firstDate.toLocaleDateString("en-us", formattingOptions) + " - " + lastDate.toLocaleDateString("en-us", formattingOptions);
    } else if (period == 1 || period == 2) { // Weekly or Biweekly
        data = getEmptyFourWeeksMap(startDate);
        dataGrey = [...data.values];

        // Set the dates to be used as a chart title
        firstDate = data.ranges[0].startDate;
        lastDate = data.ranges[3].endDate;
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
        firstDate = data.ranges[0].startDate;
        lastDate = data.ranges[4].endDate;
        descriptionDates = firstDate.getFullYear() + " - " + lastDate.getFullYear();
    }

    for (const key of keys) {
        const amount = earningList[key].data.amount;
        const dates = earningList[key].allDates;
        
        for (const date of dates) {
            const localDate = new Date(date);
            var curDate = new Date(localDate.getUTCFullYear(), localDate.getUTCMonth(), localDate.getUTCDate());
            const todayDate = new Date().setHours(0,0,0,0);

            if (period == 3) {
                const curMonth = curDate.getMonth();

                if (curDate <= todayDate) {
                    data.values[curMonth] = parseFloat((data.values[curMonth] + amount).toFixed(2));
                } else {
                    dataGrey[curMonth] = parseFloat((dataGrey[curMonth] + amount).toFixed(2));
                } 
            } else {
                const index = getIndexOfRanges(curDate, data.ranges)

                if (index < 0) {
                    continue;
                }

                if (curDate <= todayDate) {
                    data.values[index] = parseFloat((data.values[index] + amount).toFixed(2));
                } else {
                    dataGrey[index] = parseFloat((dataGrey[index] + amount).toFixed(2));
                }
            }
        }
    }

    return { "data": data.values, "dataGrey": dataGrey, "labels": data.labels, "description": description, "descriptionDates": descriptionDates };
}