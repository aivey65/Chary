function getUserData() {
    fetch('/data/all').then(response => response.json()).then((responseData) => {
        data = responseData.data
        
        infoPanel = loadUserInfo(data.balance, data.username)
        budgetPanel = loadBudgets(data.budgets)
        expensePanel = loadExpenses(data.expenses)

        dashboardContent = document.getElementById('dashboard-content');
        dashboardContent.append(infoPanel, budgetPanel, expensePanel)
    })
}