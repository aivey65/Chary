function getBudgetData() {
    fetch('/data/budgets').then(response => response.json()).then((responseData) => {
        categories = responseData.categories

        console.log(categories);
    })
}

function getFormData(type) {
    itemID = document.getElementById("itemID");
    if (itemID == -1) {
        return
    }

    fetch('/data/budgets').then(response => response.json()).then((responseData) => {
        categories = responseData.categories

        console.log(categories);
    })
}