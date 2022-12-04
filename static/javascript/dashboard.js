function getUserData() {
    fetch('/data/all').then(response => response.json()).then((responseData) => {
        data = responseData.data
        
        infoPanel = loadUserInfo(data.balance, data.username, data.profileColor, data.profileImage)
        userContent = document.getElementById('profile-section');
        userContent.append(infoPanel);

        budgetPanel = loadBudgets(data.budgets)
        budgetContent = document.getElementById('budget-container');
        budgetContent.append(budgetPanel);


        expensePanel = loadExpenses(data.expenses)
        expenseContent = document.getElementById('expense-container');
        expenseContent.append(expenseHeading, expensePanel);
    })
}