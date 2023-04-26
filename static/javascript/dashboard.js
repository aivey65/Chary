function getUserData() {
    fetch('/data/all').then(response => response.json()).then((responseData) => {
        budgetTab();
        
        data = responseData.data
        
        infoPanel = loadUserInfo(data.balance, data.username, data.profileColor, data.profileImage, data.currency)
        userContent = document.getElementById('profile-section');
        userContent.append(infoPanel);

        budgetPanel = loadBudgets(data.budgets, data.currency)
        budgetContent = document.getElementById('budget-container');
        budgetContent.append(budgetPanel);

        expensePanel = loadExpenses(data.expenses, data.currency)
        expenseContent = document.getElementById('expense-container');
        expenseContent.append(expensePanel);
    })
}

function goToBudgetForm() {
    window.location.href = "/acd-budget/-1";
}

function goToEarningForm() {
    window.location.href = "/acd-earning/-1";
}

function goToExpenseForm() {
    window.location.href = "/acd-expense/-1";
}

// Functions for different Dashboard tabs
function budgetTab() {
    budgetSection = document.getElementById("budget-section");
    budgetSection.style.display = "block";

    expenseSection = document.getElementById("expense-section");
    expenseSection.style.display = "none";

    earningSection = document.getElementById("earning-section");
    earningSection.style.display = "none";
}

function earningTab() {
    budgetSection = document.getElementById("budget-section");
    budgetSection.style.display = "none";

    expenseSection = document.getElementById("expense-section");
    expenseSection.style.display = "none";

    earningSection = document.getElementById("earning-section");
    earningSection.style.display = "block";
}

function expenseTab() {
    budgetSection = document.getElementById("budget-section");
    budgetSection.style.display = "none";

    expenseSection = document.getElementById("expense-section");
    expenseSection.style.display = "block";

    earningSection = document.getElementById("earning-section");
    earningSection.style.display = "none";
}