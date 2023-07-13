var userData = null;
const PERIODS = ["Daily", "Weekly", "Biweekly", "Monthly", "Yearly"]

// Function gets called everytime the dashboard is visited or refreshed
async function loadDashboard(refresh="false", tab="overview") {
    // Determine if local storage needs to be changed or not
    if (refresh == "true" || userData == null) {
        const response = updateUserData();
        response.then(() => {
            fillProfilePics(userData.profileImage);
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
}

// Refresh boolean should be set to true when there is already user data saved, but it
// needs to be updated.
async function updateUserData() {
    const response = await fetch('/data/all-current').then(response => response.json()).then((responseData) => {
        userData = responseData.data;
    });
    return response;
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

    changeActiveTab(document.getElementById('overview-tab'))
    changeActiveDot(0, "overview-dots")
}

function loadBudgetTab() {
    const header = document.createElement('h1');
    header.id = 'tab-header';    
    header.textContent = "Budgets";

    const addButton = document.createElement('button');
    addButton.onclick = goToBudgetForm;
    addButton.id = "add-budget-button";
    addButton.textContent = "+ New";

    const tabHead = document.createElement('div');
    tabHead.append(header, addButton);
    tabHead.id = 'tab-head';

    budgetContainer = generateBudgetsUI(userData.budgets, userData.currency);

    const budgetTab = document.createElement('div');
    budgetTab.id = 'budget-section';
    budgetTab.append(tabHead, budgetContainer)

    const tabBody = document.getElementById('dashboard-main');
    tabBody.innerHTML = "";
    tabBody.append(budgetTab);

    changeActiveTab(document.getElementById('budget-tab'));
}

function loadEarningTab() {
    const header = document.createElement('h1');
    header.id = 'tab-header';
    header.textContent = "Earnings";

    const addButton = document.createElement('button');
    addButton.onclick = goToEarningForm;
    addButton.id = "add-earning-button";
    addButton.textContent = "+ New";

    const tabHead = document.createElement('div');
    tabHead.append(header, addButton);
    tabHead.id = 'tab-head';

    table = generateTableUI(1, userData.earnings, userData.currency);

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

function loadExpenseTab() {
    const header = document.createElement('h1');
    header.id = 'tab-header';
    header.textContent = "Expenses";

    const addButton = document.createElement('button');
    addButton.onclick = goToExpenseForm;
    addButton.id = 'add-expense-button';
    addButton.textContent = "+ New";

    const tabHead = document.createElement('div');
    tabHead.append(header, addButton);
    tabHead.id = 'tab-head';

    const table = generateTableUI(0, userData.expenses.expenses, userData.currency);

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

////////////////////////////
// Data Loading Functions //
////////////////////////////

function generateOverviewCharts() {
    const overviewChartContainer = document.createElement('div');
    overviewChartContainer.id = 'chart-snip-container';
    overviewChartContainer.classList.add('snip-containers');

    const overviewHeader = document.createElement('h3');
    overviewHeader.textContent = "Analytics";
    overviewHeader.classList.add('module-header');
    overviewChartContainer.append(overviewHeader);

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

    const limitedBudgetsContainer = document.createElement("div");
    limitedBudgetsContainer.id = "limited-budgets-container";
    limitedBudgetsContainer.append(generateLimitedOverviewBudgets(budgets, 0, 3));
    overviewBudgetContainer.append(limitedBudgetsContainer);
    
    const dotCarousel = budgetCarouselButtons(budgets, "overview-dots", 3);
    overviewBudgetContainer.append(dotCarousel);

    return overviewBudgetContainer;
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

function budgetCarouselButtons(budgets, uniqueClass, maxShow=3) {
    var dotsToReturn = document.createElement("div");
    dotsToReturn.classList.add("carousel");

    budgetsLength = Object.keys(budgets).length
    numSlides = Math.ceil(budgetsLength / maxShow);

    for (var slideNum = 0; slideNum < numSlides; slideNum++) {
        const dot = document.createElement("div");
        dot.classList.add("carousel-dot", uniqueClass);

        const currentSlide = slideNum;
        dot.addEventListener("click", () => {
            dotClick(budgets, currentSlide, maxShow, uniqueClass)
        });

        dotsToReturn.append(dot);
    }

    return dotsToReturn;
}

function dotClick(budgets, slideNum, maxShow, uniqueClass) {
    // First, change which dot is active and get the current and new dot indeces
    const previousIndex = changeActiveDot(slideNum, uniqueClass);

    if (slideNum == previousIndex) {
        return
    }

    // Update the content and create a transition depending on which dot is before the other
    const budgetContainer = document.getElementById('limited-budgets-container');
    const firstChild = budgetContainer.firstChild;
    const newChild = generateLimitedOverviewBudgets(budgets, slideNum, maxShow);
    budgetContainer.append(newChild);

    if (slideNum < previousIndex) { // Slide right
        firstChild.addEventListener("animationend", (e) => {
            e.target.remove();
        });  
        newChild.style.animation = "slideInLeft 700ms ease-in-out";
        firstChild.style.animation = "slideOutRight 700ms ease-in-out";
 
    } else { // Slide left
        firstChild.addEventListener("animationend", (e) => {
            e.target.remove();
        });  
        newChild.style.animation = "slideInRight 700ms ease-in-out";
        firstChild.style.animation = "slideOutLeft 700ms ease-in-out";
    }
}

function changeActiveDot(slideNum, uniqueClass) {
    const buttons = document.getElementsByClassName(uniqueClass);
    const buttonsLength = Object.keys(buttons).length

    var previousSlide;
    for (var index = 0; index < buttonsLength; index++) {
        const dot = buttons[index];
        if (dot.classList.contains("active-dot")) {// This is the previously selected dot
            if (index == slideNum) { // This means the active dot was clicked again
                return index;
            } else {
                previousSlide = index;
                dot.classList.add("inactive-dot");
                dot.classList.remove("active-dot");
            }
        } else if (index == slideNum) {
            dot.classList.add("active-dot");
            dot.classList.remove("inactive-dot");
        } else {
            dot.classList.add("inactive-dot");
            dot.classList.remove("active-dot");
        }
    }

    return previousSlide;
}

function generateOverviewExpenses() {
    const overviewExpenseContainer = document.createElement('div');
    overviewExpenseContainer.id = 'expense-snip-container';
    overviewExpenseContainer.classList.add('snip-containers');

    const overviewHeader = document.createElement('h3');
    overviewHeader.textContent = "Recent Expenses";
    overviewHeader.classList.add('module-header');

    const expenseTable = generateTableUI(0, userData.expenses.expenses, userData.currency);

    overviewExpenseContainer.append(overviewHeader, expenseTable);
    return overviewExpenseContainer;
}

function generateOverviewEarnings() {
    const overviewEarningContainer = document.createElement('div');
    overviewEarningContainer.id = 'earning-snip-container';
    overviewEarningContainer.classList.add('snip-containers');

    const overviewHeader = document.createElement('h3');
    overviewHeader.textContent = "Recent Earnings";
    overviewHeader.classList.add('module-header');

    const earningTable = generateTableUI(1, userData.earnings, userData.currency);

    overviewEarningContainer.append(overviewHeader, earningTable);
    return overviewEarningContainer;
}