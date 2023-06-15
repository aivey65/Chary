var userData = null;
const PERIODS = ["Daily", "Weekly", "Biweekly", "Monthly", "Yearly"]

// Function gets called everytime the dashboard is visited or refreshed
async function loadDashboard(refresh=false, tab="overview") {
    // Determine if local storage needs to be changed or not
    if (refresh || userData == null) {
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
    const chartPanel = generateOverviewCharts();
    const budgetPanel = generateOverviewBudgets(userData.budgets, userData.currency);
    const earningPanel = generateOverviewEarnings(userData.earnings, userData.currency);
    const expensePanel = generateOverviewExpenses(userData.expenses, userData.currency);

    const overviewTab = document.createElement('div');
    overviewTab.id = 'overview-section';
    overviewTab.append(chartPanel, budgetPanel, earningPanel, expensePanel)

    const tabBody = document.getElementById('dashboard-main');
    tabBody.innerHTML = "";
    tabBody.append(overviewTab);

    changeActiveTab(document.getElementById('overview-tab'))
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

    budgetPanel = generateBudgetsUI(userData.budgets, userData.currency);

    const budgetContainer = document.createElement('div');
    budgetContainer.id = "budget-container";
    budgetContainer.append(budgetPanel);

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

    const tableHead = document.createElement('thead');
    row = document.createElement('tr');
    columns = ['Name', 'Earning Amount', 'Description', 'Date', 'Recurring?', 'Edit'];
    columns.forEach(title => {
        col = document.createElement('th');
        col.textContent = title;
        row.append(col);
    })
    tableHead.append(row);

    const tableBody = document.createElement('tbody');
    tableData = generateEarningsUI(userData.earnings, userData.currency);
    tableBody.append(...tableData.children);

    table = document.createElement('table');
    table.append(tableHead, tableBody);

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

    const tableHead = document.createElement('thead');
    row = document.createElement('tr');
    columns = ['Name', 'Expense Amount', 'Budget Category', 'Description', 'Date', 'Recurring?', 'Edit']
    columns.forEach(title => {
        col = document.createElement('th');
        col.textContent = title;
        row.append(col);
    })
    tableHead.append(row);

    const tableBody = document.createElement('tbody');
    tableData = generateExpensesUI(userData.expenses, userData.currency);
    tableBody.append(...tableData.children);

    table = document.createElement('table');
    table.append(tableHead, tableBody);

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

/* Creates and displays UI for the user information panal
 * 
 * @param balance (int): Number value for user's balance
 * @param username (string): User's username
 * @param img (string): link to user's profile image
 */
function generateProfileUI(balance, username, color, img, currency) {
    const user_name = document.getElementById("user-name");
    user_name.textContent = "Welcome, " + username;

    const user_balance = document.getElementById("user-balance");
    user_balance.textContent = String(currency) + String(balance);

    const user_currency = document.getElementById("user-currency");
    user_currency.textContent = "Currency: " + String(currency);

    const user_img = document.createElement('img');
    user_img.src = "static/images/profileImages/" + img + ".svg";
    user_img.classList.add('thumbnail');
    document.getElementById("profile-img-container").append(user_img);
}

function generateOverviewCharts() {
    const overviewChartContainer = document.createElement('div');
    overviewChartContainer.id = 'chart-snip-container';
    overviewChartContainer.classList.add('snip-containers');

    const overviewHeader = document.createElement('h3');
    overviewHeader.textContent = "Analytics";
    overviewChartContainer.append(overviewHeader);

    return overviewChartContainer;
}

function generateOverviewBudgets(budgets, currency) {
    const overviewBudgetContainer = document.createElement('div');
    overviewBudgetContainer.id = 'budget-snip-container';
    overviewBudgetContainer.classList.add('snip-containers');

    const overviewHeader = document.createElement('h3');
    overviewHeader.textContent = "Budget Information";
    overviewBudgetContainer.append(overviewHeader);
    
    for (const key in budgets) {
        const budgetSnippet = document.createElement('div');
        budgetSnippet.classList.add('budget-snippet');
        budgetSnippet.addEventListener('click', function(e) {
            if (!e.target.classList.contains('snip-edit')) {
                window.location = "/expand-budget?id=" + key;
            }
        })

        var recur_img;
        if (budgets[key].recurring) {
            recur_img = document.createElement('img');
            recur_img.src = 'static/images/recurIcon.svg';
            recur_img.classList.add('recur-img');
            const period = PERIODS[budgets[key].budgetPeriod].toLocaleLowerCase();
            recur_img.title = "This budget recurs " + period + ".";
        }
        
        const budget_name = document.createElement('p');
        budget_name.classList.add('snip-budget-name');
        budget_name.textContent = budgets[key].name;

        const budget_used = document.createElement('p');
        budget_used.classList.add('snip-budget-used');
        budget_used.textContent = (budgets[key].usedAmount / budgets[key].amount * 100).toFixed(1) + "% used";

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
        
        const fillAmount = budgets[key].usedAmount;
        if (fillAmount != 0) {
            path2.setAttribute('x1', '10');
            path2.setAttribute('x2', '190');
            path2.setAttribute('y1', '10');
            path2.setAttribute('y2', '10');
            path2.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
    
            path2Length = path2.getAttribute('x2') - path2.getAttribute('x1');
            path2.setAttribute('stroke-dasharray', (fillAmount/budgets[key].amount) * path2Length + ' ' + path2Length);
            path2.classList.add('snip-inner-progress');

            svg.append(path1, path2);  
        }

        svgDiv.append(svg);

        // End progress svg

        budgetSnippet.append(recur_img, budget_name, svgDiv, budget_used, budget_edit);
        
        overviewBudgetContainer.append(budgetSnippet)
    }

    return overviewBudgetContainer;
}

function generateOverviewExpenses() {
    const overviewExpenseContainer = document.createElement('div');
    overviewExpenseContainer.id = 'expense-snip-container';
    overviewExpenseContainer.classList.add('snip-containers');

    const overviewHeader = document.createElement('h3');
    overviewHeader.textContent = "Recent Expenses";
    overviewExpenseContainer.append(overviewHeader);

    return overviewExpenseContainer;
}

function generateOverviewEarnings() {
    const overviewEarningContainer = document.createElement('div');
    overviewEarningContainer.id = 'earning-snip-container';
    overviewEarningContainer.classList.add('snip-containers');

    const overviewHeader = document.createElement('h3');
    overviewHeader.textContent = "Recent Earnings";
    overviewEarningContainer.append(overviewHeader);

    return overviewEarningContainer;
}

/* Creates and displays UI for all budget information
 * 
 * @param budgets (list): A list of IDs that each correspond to a budget
 *      stored in the database.
 * @param currency (string): A single character representing the user's currency symbol
 */
function generateBudgetsUI(budgets, currency) {
    budgetContainer = document.createElement('div');
    budgetContainer.id = 'budget-container';
    
    for (const key in budgets) {
        const budgetPanel = document.createElement('div');
        budgetPanel.classList.add('budget-info');
        budgetPanel.addEventListener('click', function(e) {
            if (!e.target.classList.contains('options')) {
                window.location = "/expand-budget?id=" + key;
            }
        })

        const optionsImg = document.createElement('img');
        optionsImg.src = "static/images/Options-icon.svg";
        optionsImg.classList.add('options-img', 'options');
        optionsImg.title = "Options";

        var recur_img;
        if (budgets[key].recurring) {
            recur_img = document.createElement('img');
            recur_img.src = 'static/images/recurIcon.svg';
            recur_img.classList.add('recur-img');
            const period = PERIODS[budgets[key].budgetPeriod].toLocaleLowerCase();
            recur_img.title = "This budget recurs " + period + ".";
        }
        
        const budget_name = document.createElement('h2');
        budget_name.classList.add('budget-name');
        budget_name.textContent = budgets[key].name;

        const budget_used = document.createElement('p');
        budget_used.classList.add('fraction-top');
        budget_used.textContent = currency + budgets[key].usedAmount;

        const budget_slash = document.createElement('h2');
        budget_slash.classList.add('fraction-slash');
        budget_slash.textContent = "／"

        const budget_amount = document.createElement('p');
        budget_amount.classList.add('fraction-bottom');
        budget_amount.textContent = currency + budgets[key].amount;

        // Progess SVG
        const svgDiv = document.createElement('div');
        svgDiv.classList.add('svg-div');

        const svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        svg.setAttribute('width', '200');
        svg.setAttribute('height', '120');
        svg.setAttribute('viewbox', '0 0 200 120');
        svg.classList.add('progress-svg');
        svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");

        const path1 = document.createElementNS("http://www.w3.org/2000/svg", 'path');
        path1.setAttribute('d', 'M15,100 a60,60 0 0,1 170,0');
        path1.classList.add('outer-progress');
        path1.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
        svg.append(path1);

        const fillAmount = budgets[key].usedAmount;
        if (fillAmount != 0) {
            const path2 = document.createElementNS("http://www.w3.org/2000/svg", 'path');
            path2.setAttribute('d', 'M15,100 a60,60 0 0,1 170,0');
            path2Length = path2.getTotalLength();
            path2.setAttribute('stroke-dasharray', (fillAmount/budgets[key].amount) * path2Length + ' ' + path2Length);
            path2.classList.add('inner-progress');
            path2.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
            
            svg.append(path2);
        }

        svgDiv.append(svg);

        // End progress svg
        // Create Popup options for budget info
        const budget_update_img = document.createElement('img');
        budget_update_img.src = "static/images/EditButtonSM.svg";
        
        const budget_update_text = document.createElement('h4');
        budget_update_text.textContent = "Edit";
        const budget_update = document.createElement('div');
        budget_update.classList.add('budget-edit', 'options');
        budget_update.addEventListener('click', function() {
            window.location = "/form/update-budget?id=" + key;
        })
        budget_update.append(budget_update_img, budget_update_text);

        const budget_more_img = document.createElement('img');
        budget_more_img.src = "static/images/MoreButtonsmall.svg";        
        
        const budget_more_text = document.createElement('h4');
        budget_more_text.textContent = "See More";
        const budget_more = document.createElement('div');
        budget_more.classList.add('budget-more', 'options');
        budget_more.addEventListener('click', function() {
            window.location = "/expand-budget?id=" + key;
        })
        budget_more.append(budget_more_img, budget_more_text)

        const optionsPanel = document.createElement('div');
        optionsPanel.classList.add('options-panel', 'options');
        optionsPanel.style.display = "none";
        optionsPanel.append(budget_update, budget_more);
        optionsImg.addEventListener('click', (event) => {
            optionsToggle(event.target, optionsPanel);
        }, false);
        const budget_options = document.createElement('div');
        budget_options.classList.add('options-div', 'options');
        budget_options.append(optionsImg, optionsPanel);

        budgetPanel.append(budget_options, recur_img, budget_name, svgDiv, budget_used, budget_slash, budget_amount);
        budgetContainer.append(budgetPanel);
    }

    return budgetContainer;
}

function optionsToggle(button, optionsPanel) {
    const panelHidden = optionsPanel.style.display == "none";
    boundFunction = windowClick.bind(window, optionsPanel, button);

    if (panelHidden) {
        optionsPanel.style.display = "block";
        windowClickEnable(boundFunction);
    } else {
        optionsPanel.style.display = "none";
        windowClickDisable(boundFunction);
    }
}

function windowClickEnable(boundFunction) {
    window.addEventListener('click', boundFunction, true); 
}

function windowClickDisable(boundFunction) {
    window.removeEventListener('click', boundFunction, true);
}

function windowClick(optionsPanel, button) {
    const panelClick = this.event.target == optionsPanel; // Make sure the panel itself wasn't selected.
    const propagation = this.event.target == button; // Check to see if the window click event is the options button. 
    
    if (!panelClick) {
        if (!propagation) { // To avoid propagation issues, do not set to 'none' if it was the options' button click
            optionsPanel.style.display = "none";
        }

        windowClickDisable(boundFunction);
    }
}

/* Creates and displays UI for all earning information
 * 
 * @param earnings (List): List of a user's earnings
 * @param currency (string): A single character representing the user's currency symbol
 */
function generateEarningsUI(earnings, currency) {
    earningContainer = document.createElement('div');
    
    for (const key in earnings) {
        current = earnings[key].data;

        const earning_name = document.createElement('td');
        earning_name.textContent = current.name;

        const earning_amount = document.createElement('td');
        earning_amount.textContent = currency + current.amount;

        const earning_des = document.createElement('td');
        earning_des.textContent = current.description;
        earning_des.classList.add('long-text');

        earning_recur = document.createElement('td');
        if (current.recurring) {
            const recur_img = document.createElement('img');
            recur_img.classList.add('recur-img');
            recur_img.src = "static/images/recurIcon.svg";
            recur_img.title = "This earning is recurring over a specified period of time";
            earning_recur.append(recur_img);
        }

        const earning_update = document.createElement('td');
        const earning_update_img = document.createElement('img');
        earning_update_img.src = "static/images/EditButtonSM.svg"
        earning_update_img.classList.add("update-img");
        earning_update_img.title = "Update";
        earning_update_img.addEventListener('click', function() {
            window.location = "/form/update-earning?id=" + key;
        })
        earning_update.append(earning_update_img);

        dates = earnings[key].dates;
        dates.forEach(date => {
            const earning_date = document.createElement('td');
            const formatDate =  new Date(date);
            earning_date.textContent = formatDate.toLocaleDateString();

            const earningRow = document.createElement('tr');
            earningRow.classList.add('earning-row');
            earningRow.append(earning_name.cloneNode(true), earning_amount.cloneNode(true), earning_des.cloneNode(true), earning_date, earning_recur.cloneNode(true), earning_update.cloneNode(true));
            earningContainer.append(earningRow)
        }) 
    }

    return earningContainer;
}

/* Creates and displays UI for all expense information
 * Going with a table layout for the expense data.
 * 
 * @param expenses (List): List of a user's expenses
 * @param currency (string): A single character representing the user's currency symbol
 */
function generateExpensesUI(expenseDict, currency) {
    const expenseContainer = document.createElement('div');

    budgetCategories = expenseDict.categories;
    expenses = expenseDict.expenses;
    
    for (const key in expenses) {
        const current = expenses[key].data;

        const expense_name = document.createElement('td');
        expense_name.textContent = current.name;

        const expense_amount = document.createElement('td');
        expense_amount.textContent = currency + current.amount;

        const expense_category = document.createElement('td');
        expense_category.textContent = current.budgetCategory;

        const expense_des = document.createElement('td');
        expense_des.textContent = current.description;
        expense_des.classList.add('long-text');

        expense_recur = document.createElement('td');
        if (current.recurring) {
            const recur_img = document.createElement('img');
            recur_img.classList.add('recur-img');
            recur_img.src = "static/images/recurIcon.svg";
            recur_img.title = "This expense is recurring over a specified period of time";
            expense_recur.append(recur_img);
        }

        const expense_update = document.createElement('td');
        const expense_update_img = document.createElement('img');
        expense_update_img.src = "static/images/EditButtonSM.svg"
        expense_update_img.classList.add("update-img");
        expense_update_img.title = "Update";
        expense_update_img.addEventListener('click', function() {
            window.location = "/form/update-expense?id=" + key;
        })
        expense_update.append(expense_update_img);

        dates = expenses[key].dates;
        dates.forEach(date => {
            const expense_date = document.createElement('td');
            const formatDate =  new Date(date);
            expense_date.textContent = formatDate.toLocaleDateString();

            const expenseRow = document.createElement('tr');
            expenseRow.classList.add('expense-row');
            expenseRow.append(expense_name.cloneNode(true), expense_amount.cloneNode(true), expense_category.cloneNode(true), expense_des.cloneNode(true), expense_date, expense_recur.cloneNode(true), expense_update.cloneNode(true));
            expenseContainer.append(expenseRow)
        }) 
    }

    return expenseContainer;
}