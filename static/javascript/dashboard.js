var userData = null;
const PERIODS = ["Daily", "Weekly", "Biweekly", "Monthly", "Yearly"]

function setLocalData(newData) {
    userData = newData;
}

// Function gets called everytime the dashboard is visited or refreshed
async function loadDashboard(refresh=false, tab="overview") {
    if (refresh || userData == null) {
        const response = updateUserData();
        response.then(() => {
            loadProfileData();

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

function loadProfileData() {
    // Populating the info panel, which is always visible
    infoPanel = generateProfileUI(userData.balance, userData.username, userData.profileColor, userData.profileImage, userData.currency);
    const userContent = document.getElementById('profile-section');
    userContent.append(infoPanel);
}

function loadOverviewTab() {
    budgetPanel = generateOverviewBudgets(userData.budgets, userData.currency);
    earningPanel = generateOverviewEarnings(userData.earnings, userData.currency);
    expensePanel = generateOverviewExpenses(userData.expenses, userData.currency);

    const tabBody = document.getElementById('tab-container');
    tabBody.innerHTML = "";
    tabBody.append(budgetPanel, earningPanel, expensePanel);

    changeActiveTab(document.getElementById('overview-tab'))
}

function loadBudgetTab() {
    const header = document.createElement('h1');
    header.id = 'tab-header';    
    header.textContent = "Budgets";

    const addButton = document.createElement('button');
    addButton.onclick = goToBudgetForm;
    addButton.id = "add-budget-button";
    addButton.textContent = "+ Add Budget";

    budgetPanel = generateBudgetsUI(userData.budgets, userData.currency);

    const budgetContainer = document.createElement('div');
    budgetContainer.id = "budget-container";
    budgetContainer.append(budgetPanel);

    const tabBody = document.getElementById('tab-container');
    tabBody.innerHTML = "";
    tabBody.append(header, addButton, budgetContainer);

    changeActiveTab(document.getElementById('budget-tab'));
}

function loadEarningTab() {
    const header = document.createElement('h1');
    header.id = 'tab-header';
    header.textContent = "Earnings";

    const addButton = document.createElement('button');
    addButton.onclick = goToEarningForm;
    addButton.id = "add-earning-button";
    addButton.textContent = "+ Add Earning";

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
    earningContainer.append(table);

    const tabBody = document.getElementById('tab-container');
    tabBody.innerHTML = "";
    tabBody.append(header, addButton, earningContainer);

    changeActiveTab(document.getElementById('earning-tab'));
}

function loadExpenseTab() {
    const header = document.createElement('h1');
    header.id = 'tab-header';
    header.textContent = "Expenses";

    const addButton = document.createElement('button');
    addButton.onclick = goToExpenseForm;
    addButton.id = 'add-expense-button';
    addButton.textContent = "+ Add Expense";

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
    expenseContainer.append(table);

    const tabBody = document.getElementById('tab-container');
    tabBody.innerHTML = "";
    tabBody.append(header, addButton, expenseContainer);

    changeActiveTab(document.getElementById('expense-tab'));
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
    const infoPanel = document.createElement('div');
    infoPanel.classList.add('user-info');
    
    const user_name = document.createElement('h2');
    user_name.textContent = username;

    const user_balance = document.createElement('h3');
    user_balance.textContent = balance;

    const user_img = document.createElement('img');
    user_img.src = "static/images/profileImages/" + img + ".svg";
    user_img.classList.add('thumbnail');

    infoPanel.append(user_img, user_name); //TODO: Add user_balance when you know what to do with it
    return infoPanel;
}

function generateOverviewBudgets() {

}

function generateOverviewExpenses() {

}

function generateOverviewEarnings() {

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
            if (!e.target.classList.contains('budget-edit')) {
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
        
        const budget_name = document.createElement('h2');
        budget_name.classList.add('budget-name');
        budget_name.textContent = budgets[key].name;

        const budget_des = document.createElement('p');
        budget_des.textContent = budgets[key].description;
        budget_des.classList.add('long-text');

        const budget_used = document.createElement('h3');
        budget_used.classList.add('fraction-top');
        budget_used.textContent = currency + budgets[key].usedAmount;

        const budget_slash = document.createElement('h2');
        budget_slash.classList.add('fraction-slash');
        budget_slash.textContent = "／"

        const budget_amount = document.createElement('h3');
        budget_amount.classList.add('fraction-bottom');
        budget_amount.textContent = currency + budgets[key].amount;

        // Progess SVG
        const svgDiv = document.createElement('div');
        svgDiv.classList.add('svg-div');

        const svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        const path1 = document.createElementNS("http://www.w3.org/2000/svg", 'path');
        const path2 = document.createElementNS("http://www.w3.org/2000/svg", 'path');

        svg.setAttribute('width', '200');
        svg.setAttribute('height', '120');
        svg.setAttribute('viewbox', '0 0 200 120');
        svg.classList.add('progress-svg');

        path1.setAttribute('d', 'M15,100 a60,60 0 0,1 170,0');
        path1.classList.add('outer-progress');
        path2.setAttribute('d', 'M15,100 a60,60 0 0,1 170,0');
        path2Length = path2.getTotalLength();
        path2.setAttribute('stroke-dasharray', (budgets[key].usedAmount/budgets[key].amount) * path2Length + ' ' + path2Length);
        path2.classList.add('inner-progress');

        svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
        path1.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
        path2.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
        
        svg.append(path1, path2);
        svgDiv.append(svg);

        // End progress svg

        const budget_end_date = document.createElement('h4');
        budget_end_date.textContent = budgets[key].endDate;

        const budget_update_img = document.createElement('img');
        budget_update_img.src = "static/images/EditButtonSM.svg";
        budget_update_img.classList.add("budget-edit");
        budget_update_img.title = "Update";
        budget_update_img.addEventListener('click', function() {
            window.location = "/form/update-budget?id=" + key;
        })

        const budget_more_img = document.createElement('img');
        budget_more_img.src = "static/images/MoreButtonsmall.svg";        
        budget_more_img.classList.add("budget-more");
        budget_more_img.title = "See More";
        budget_more_img.addEventListener('click', function() {
            window.location = "/expand-budget?id=" + key;
        })

        budgetPanel.append(recur_img, budget_name, budget_des, svgDiv, budget_used, budget_slash, budget_amount, budget_end_date, budget_more_img, budget_update_img);
        
        budgetContainer.append(budgetPanel)
    }

    return budgetContainer;
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