function submitBudgetForm() {
    fetch('/data/budgets').then(response => response.json()).then((responseData) => {
        categories = responseData.categories

        console.log(categories);
    })
}