function getUserData() {
    fetch('/data/all').then(response => response.json()).then((responseData) => {
        data = responseData.data
        
        infoPanel = loadUserInfo(data.balance, data.username, getProfileImage(data.profileImage))
        userContent = document.getElementById('profile-section');
        userContent.append(infoPanel)

        budgetPanel = loadBudgets(data.budgets)
        budgetContent = document.getElementById('budget-section');
        budgetContent.append(budgetPanel)


        expensePanel = loadExpenses(data.expenses)
        expenseContent = document.getElementById('expense-section');
        expenseContent.append(expensePanel)
    })
}

function getProfileImage(imageID) {
    fetch('/data/images/' + imageID).then(response => response.json()).then((responseData) => {
        console.log(responseData)
        return responseData.data
    })
}