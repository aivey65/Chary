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
        budget_name.classList.add("budget-name");
        budget_name.innerHTML = budgets[key].name;

        budget_des = document.createElement('p');
        budget_des.innerHTML = budgets[key].description;

        budget_used = document.createElement('h3');
        budget_used.classList.add("fraction-top");
        budget_used.innerHTML = budgets[key].usedAmount;

        budget_slash = document.createElement('h2');
        budget_slash.classList.add('fraction-slash');
        budget_slash.innerHTML = "／"

        budget_amount = document.createElement('h3');
        budget_amount.classList.add("fraction-bottom");
        budget_amount.innerHTML = budgets[key].actualBudgetAmount;

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
        budget_end_date.innerHTML = budgets[key].endDate;

        budget_update = document.createElement("button");
        budget_update.innerHTML = "Update";
        budget_update.addEventListener("click", function() {
            window.location = '/acd-budget/' + key;
        })

        budget_more = document.createElement("button");
        budget_more.innerHTML = "See More";
        budget_more.addEventListener("click", function() {
            window.location = '/expand-budget/' + key;
        })

        budgetPanel.append(budget_name, budget_des, svgDiv, budget_used, budget_slash, budget_amount, budget_end_date, budget_more, budget_update);
        
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
        expense_update.addEventListener("click", function() {
            window.location = '/acd-expense/' + key;
        })

        expensePanel.append(expense_category, expense_name, expense_des, expense_amount, expense_date, expense_update);
    
        expenseContainer.append(expensePanel)
    }

    return expenseContainer;
}

function acd(type, id) {
    window.location = '/acd-' + type + '/' + id;
}