// Navigation functions
function homeAction() {
    window.location = '/';
    closeMenu()
}

function bttAction() {
    window.scrollTo(0, 0);
    closeMenu()
}

function loginAction() {
    window.location = '/login';
    closeMenu()
}

function dashboardAction() {
    window.location = '/dashboard';
    closeMenu()
}

function closeMenu() {
    const navbar = document.getElementsByTagName('nav')[0]
    const logo = document.getElementById('toggle-icon')

    if(logo.display != 'none') {
        if(logo.classList.contains('hamburg')) {
            // The menu is already closed
            return;
        }

        // The menu is 'close' (or the 'X' icon). Change to hamburg
        logo.src = "../static/images/hamburger-icon.svg";
        logo.classList.replace('close', 'hamburg');
        navbar.style.width = '0%'
    }
}

function toggleMenu() {
    const navbar = document.getElementsByTagName('nav')[0]
    const logo = document.getElementById('toggle-icon')

    if(logo.display != 'none') {
        if(logo.classList.contains('hamburg')) {
            // Change to 'x' icon
            logo.src = "../static/images/x-icon.svg";
            logo.classList.replace('hamburg', 'close');
            navbar.style.width = '70%';
        } else {
            // Change to 'hamburger' icon
            logo.src = "../static/images/hamburger-icon.svg";
            logo.classList.replace('close', 'hamburg');
            navbar.style.width = '0%';
        }
    }
}

function back() {
    window.history.back();
}

//////////////////////
// Scroll Functions //
//////////////////////
var prevScrollpos = window.pageYOffset;
window.addEventListener('scroll', () => {
    const currentScrollPos = window.pageYOffset;

    // Hide/show nav bar when scrolling
    const logo = document.getElementById('toggle-icon')
    if(logo.display != 'none' && logo.classList.contains('hamburg')) {
        if (prevScrollpos > currentScrollPos) {
            document.getElementsByTagName("header")[0].style.transform = "translateY(0px)";
        } else {
            document.getElementsByTagName("header")[0].style.transform = "translateY(-70px)";
        }
        prevScrollpos = currentScrollPos;
    }
});

////////////////////////////
// Data Loading Functions //
////////////////////////////

/* Creates and displays UI for the user information panal
 * 
 * @param balance (int): Number value for user's balance
 * @param username (string): User's username
 * @param img (string): link to user's profile image
 */
function loadUserInfo(balance, username,color, img) {
    infoPanel = document.createElement('div');
    infoPanel.classList.add('user-info');
    
    user_name = document.createElement('h2');
    user_name.innerHTML = username;

    user_balance = document.createElement('h3');
    user_balance.innerHTML = balance;

    user_img = document.createElement('img');
    user_img.src = "static/images/profileImages/" + img + ".svg";
    user_img.classList.add("thumbnail");

    infoPanel.append(user_img, user_name); //TODO: Add user_balance when you know what to do with it
    return infoPanel;
}

/* First, makes request to server for budget information.
 * Then creates and displays UI for all budget information
 * 
 * @param budgets (list): A list of IDs that each correspond to a budget
 *      stored in the database.
 */
function loadBudgets(budgets) {
    budgetContainer = document.createElement('div');
    budgetContainer.id = "budget-container";
    
    for (const key in budgets) {
        budgetPanel = document.createElement('div');
        budgetPanel.classList.add('budget-info');
        
        budget_name = document.createElement('h2');
        budget_name.innerHTML = budgets[key].name;

        budget_amount = document.createElement('h3');
        budget_amount.innerHTML = budgets[key].actualBudgetAmount;

        budget_des = document.createElement('p');
        budget_des.innerHTML = budgets[key].description;

        budget_used = document.createElement('h3');
        budget_used.innerHTML = budgets[key].usedAmount;

        budget_end_date = document.createElement('h4');
        budget_end_date.innerHTML = budgets[key].endDate;

        budget_update = document.createElement("button");
        budget_update.innerHTML = "Update";
        budget_update.addEventListener("onclick", "acd('budget', " + key + ")")

        budgetPanel.append(budget_name, budget_des, budget_used, budget_amount, budget_end_date, budget_update);
        
        budgetContainer.append(budgetPanel)
    }

    return budgetContainer;
}

/* First, makes request to server for a user's expense information.
 * Then creates and displays UI for all budget information
 * 
 * @param balance (int): Number value for user's balance
 * @param username (string): User's username
 */
function loadExpenses(expenses) {
    expenseContainer = document.createElement('div');
    expenseContainer.id = "expense-info";
    
    for (const key in expenses) {
        expensePanel = document.createElement('div');
        expensePanel.classList.add('expense-info');

        expense_category = document.createElement('h4');
        expense_category.innerHTML = expenses[key].budgetCategory;

        expense_name = document.createElement('h2');
        expense_name.innerHTML = expenses[key].name;

        expense_amount = document.createElement('h3');
        expense_amount.innerHTML = expenses[key].moneyAmount;

        expense_des = document.createElement('p');
        expense_des.innerHTML = expenses[key].description;

        expense_date = document.createElement('h4');
        expense_date.innerHTML = expenses[key].date;

        expense_update = document.createElement("button");
        expense_update.innerHTML = "Update";
        expense_update.addEventListener("onclick", "acd('expense', " + key + ")")

        expensePanel.append(expense_category, expense_name, expense_des, expense_amount, expense_date, expense_update);
    
        expenseContainer.append(expensePanel)
    }

    return expenseContainer;
}

function acd(type, id) {
    window.location = '/acd-' + type + '/' + id;
}