function loadBudget(id) {
    fetch('/data/budget-expenses?id=' + id).then(response => response.json()).then((responseData) => {
        console.log(responseData);
    });
}