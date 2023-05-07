var userData = null;

function setLocalData(newData) {
    userData = newData;
}

// Function gets called everytime the dashboard is visited or refreshed
function loadDashboard() {
    var needRefresh = true;
    var loadOverview = true;
    updateUserData(needRefresh, loadOverview);
}

// Refresh boolean should be set to true when there is already user data saved, but it
// needs to be updated.
function updateUserData(refresh, overview) {
    if (userData == null || refresh) {
        fetch('/data/all').then(response => response.json()).then((responseData) => {
            userData = responseData.data;
        }).then(() => {
            if (refresh) {
                getOverviewData();
                getBudgetData();
                getEarningData();
                getExpenseData();
            }
            
            // Because fetching data is async, other functions for setting up the dashboard
            // also need to be done in an async environment. I don't like this solution so 
            // much, but it works for now. 
            if (overview) {
                overviewTab();

                // Populating the info panel, which is always visible
                infoPanel = loadUserInfo(userData.balance, userData.username, userData.profileColor, userData.profileImage, userData.currency);
                userContent = document.getElementById('profile-section');
                userContent.append(infoPanel);
            }
        });
    }
}

function getOverviewData() {
    overviewContent = document.getElementById('overview-container');

    budgetPanel = loadOverviewBudgets(userData.budgets, userData.currency);
    earningPanel = loadOverviewEarnings(userData.earnings, userData.currency);
    expensePanel = loadOverviewExpenses(userData.expenses, userData.currency);

    overviewContent.append(budgetPanel);
}

function getBudgetData() {
    budgetPanel = loadBudgets(userData.budgets, userData.currency);
    budgetContent = document.getElementById('budget-container');
    budgetContent.append(budgetPanel);
}

function getEarningData() {
    earningPanel = loadEarnings(userData.earnings, userData.currency);
    earningContent = document.getElementById('earning-container');
    // earningContent.append(...earningPanel.children);
}

function getExpenseData() {
    expensePanel = loadExpenses(userData.expenses, userData.currency);
    expenseContent = document.getElementById('expense-container');
    expenseContent.append(...expensePanel.children);
}

function goToBudgetForm() {
    window.location.href = "/acd-budget?id=-1";
}

function goToEarningForm() {
    window.location.href = "/acd-earning?id=-1";
}

function goToExpenseForm() {
    window.location.href = "/acd-expense?id=-1";
}

// Functions for different Dashboard tabs. Clunky, but I can't think of a better and more readable way to do this at the moment.
function overviewTab() {
    // If the container is empty, load the appropriate data
    // If the container is not empty, don't change anything. This will happen everytime
    // the local userdata is refreshed.
    overviewContainer = document.getElementById("overview-container");
    if (!overviewContainer.hasChildNodes()) {
        getOverviewData();
    }

    // Update which tab is active
    var tabs = document.getElementsByClassName("dashTab");
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove("active");
    }

    var newActiveTab = document.getElementById("overview-tab");
    newActiveTab.classList.add("active");

    // Show/hide the correct sections
    overviewSection = document.getElementById("overview-section");
    overviewSection.style.display = "block";

    budgetSection = document.getElementById("budget-section");
    budgetSection.style.display = "none";

    expenseSection = document.getElementById("expense-section");
    expenseSection.style.display = "none";

    earningSection = document.getElementById("earning-section");
    earningSection.style.display = "none";
}

function budgetTab() {
    budgetContainer = document.getElementById("budget-container");
    if (!budgetContainer.hasChildNodes()) {
        getBudgetData();
    }

    // Update which tab is active
    var tabs = document.getElementsByClassName("dashTab");
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove("active");
    }

    var newActiveTab = document.getElementById("budget-tab");
    newActiveTab.classList.add("active");

    // Show/hide the correct sections
    overviewSection = document.getElementById("overview-section");
    overviewSection.style.display = "none";

    budgetSection = document.getElementById("budget-section");
    budgetSection.style.display = "block";

    expenseSection = document.getElementById("expense-section");
    expenseSection.style.display = "none";

    earningSection = document.getElementById("earning-section");
    earningSection.style.display = "none";
}

function earningTab() {
    earningContainer = document.getElementById("earning-container");
    if (!earningContainer.hasChildNodes()) {
        getEarningData();
    }

    // Update which tab is active
    var tabs = document.getElementsByClassName("dashTab");
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove("active");
    }

    var newActiveTab = document.getElementById("earning-tab");
    newActiveTab.classList.add("active");

    // Show/hide the correct sections
    overviewSection = document.getElementById("overview-section");
    overviewSection.style.display = "none";

    budgetSection = document.getElementById("budget-section");
    budgetSection.style.display = "none";

    expenseSection = document.getElementById("expense-section");
    expenseSection.style.display = "none";

    earningSection = document.getElementById("earning-section");
    earningSection.style.display = "block";
}

function expenseTab() {
    expenseContainer = document.getElementById("expense-container");
    if (!expenseContainer.hasChildNodes()) {
        getExpenseData();
    }

    // Update which tab is active
    var tabs = document.getElementsByClassName("dashTab");
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove("active");
    }

    var newActiveTab = document.getElementById("expense-tab");
    newActiveTab.classList.add("active");

    // Show/hide the correct sections
    overviewSection = document.getElementById("overview-section");
    overviewSection.style.display = "none";

    budgetSection = document.getElementById("budget-section");
    budgetSection.style.display = "none";

    expenseSection = document.getElementById("expense-section");
    expenseSection.style.display = "block";

    earningSection = document.getElementById("earning-section");
    earningSection.style.display = "none";
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
function loadUserInfo(balance, username, color, img, currency) {
    infoPanel = document.createElement('div');
    infoPanel.classList.add('user-info');
    
    user_name = document.createElement('h2');
    user_name.textContent = username;

    user_balance = document.createElement('h3');
    user_balance.textContent = balance;

    user_img = document.createElement('img');
    user_img.src = "static/images/profileImages/" + img + ".svg";
    user_img.classList.add("thumbnail");

    infoPanel.append(user_img, user_name); //TODO: Add user_balance when you know what to do with it
    return infoPanel;
}

function loadOverviewBudgets() {

}

function loadOverviewExpenses() {

}

function loadOverviewEarnings() {

}

/* Creates and displays UI for all budget information
 * 
 * @param budgets (list): A list of IDs that each correspond to a budget
 *      stored in the database.
 * @param currency (string): A single character representing the user's currency symbol
 */
function loadBudgets(budgets, currency) {
    budgetContainer = document.createElement('div');
    budgetContainer.id = "budget-container";
    
    for (const key in budgets) {
        budgetPanel = document.createElement('div');
        budgetPanel.classList.add('budget-info');
        
        budget_name = document.createElement('h2');
        budget_name.classList.add("budget-name");
        budget_name.textContent = budgets[key].name;

        budget_des = document.createElement('p');
        budget_des.textContent = budgets[key].description;

        budget_used = document.createElement('h3');
        budget_used.classList.add("fraction-top");
        budget_used.textContent = currency + budgets[key].usedAmount;

        budget_slash = document.createElement('h2');
        budget_slash.classList.add('fraction-slash');
        budget_slash.textContent = "／"

        budget_amount = document.createElement('h3');
        budget_amount.classList.add("fraction-bottom");
        budget_amount.textContent = currency + budgets[key].actualBudgetAmount;

        // Progess SVG
        var svgDiv = document.createElement('div');
        svgDiv.classList.add("svg-div");

        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        var path1 = document.createElementNS("http://www.w3.org/2000/svg", 'path');
        var path2 = document.createElementNS("http://www.w3.org/2000/svg", 'path');

        svg.setAttribute('width', '200');
        svg.setAttribute('height', '120');
        svg.setAttribute('viewbox', '0 0 200 120');
        svg.classList.add('progress-svg');

        path1.setAttribute('d', 'M15,100 a60,60 0 0,1 170,0');
        path1.classList.add('outer-progress');
        path2.setAttribute('d', 'M15,100 a60,60 0 0,1 170,0');
        path2Length = path2.getTotalLength();
        path2.setAttribute('stroke-dasharray', (budgets[key].usedAmount/budgets[key].actualBudgetAmount) * path2Length + ' ' + path2Length);
        path2.classList.add('inner-progress');

        svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
        path1.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
        path2.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
        
        svg.append(path1, path2);
        svgDiv.append(svg);

        // End progress svg

        budget_end_date = document.createElement('h4');
        budget_end_date.textContent = budgets[key].endDate;

        budget_update = document.createElement("button");
        budget_update.textContent = "Update";
        budget_update.addEventListener("click", function() {
            window.location = '/acd-budget/' + key;
        })

        budget_more = document.createElement("button");
        budget_more.textContent = "See More";
        budget_more.addEventListener("click", function() {
            window.location = '/expand-budget?id=' + key;
        })

        budgetPanel.append(budget_name, budget_des, svgDiv, budget_used, budget_slash, budget_amount, budget_end_date, budget_more, budget_update);
        
        budgetContainer.append(budgetPanel)
    }

    return budgetContainer;
}

/* Creates and displays UI for all earning information
 * 
 * @param earning (List): List of a user's earnings
 * @param currency (string): A single character representing the user's currency symbol
 */
function loadEarnings(earnings, currency) {
}

/* Creates and displays UI for all expense information
 * Going with a table layout for the expense data.
 * 
 * @param expenses (List): List of a user's expenses
 * @param currency (string): A single character representing the user's currency symbol
 */
function loadExpenses(expenses, currency) {
    expenseContainer = document.createElement('div');
    
    for (const key in expenses) {
        expenseRow = document.createElement('tr');
        expenseRow.classList.add('expense-row');

        expense_name = document.createElement('td');
        expense_name.textContent = expenses[key].name;

        expense_amount = document.createElement('td');
        expense_amount.textContent = currency + expenses[key].actualAmount;

        expense_category = document.createElement('td');
        expense_category.textContent = expenses[key].budgetCategory;

        expense_des = document.createElement('td');
        expense_des.textContent = expenses[key].description;

        expense_predict = document.createElement('td');
        predict_amount = expenses[key].expectedAmount;
        if (predict_amount >= 0) {
            expense_predict.textContent = currency + expenses[key].expectedAmount;
        }

        expense_date = document.createElement('td');
        expense_date.textContent = expenses[key].date;

        expense_recur = document.createElement('td');
        if (expenses[key].recurring) {
            recur_img = document.createElement('img');
            recur_img.classList.add('recur-img');
            recur_img.src = "static/images/recurIcon.svg";
            recur_img.title = "This expense is recurring over a specified period of time";
            expense_recur.append(recur_img);
        }

        expense_update = document.createElement("td");
        expense_update_img = document.createElement("img");
        expense_update_img.src = "static/images/EditButtonSM.svg"
        expense_update_img.addEventListener("click", function() {
            window.location = '/acd-expense?id=' + key;
        })
        expense_update.append(expense_update_img);

        expenseRow.append(expense_name, expense_amount, expense_category, expense_des, expense_predict, expense_date, expense_recur, expense_update);
        expenseContainer.append(expenseRow)
    }

    return expenseContainer;
}