const PERIODS = ["Daily", "Weekly", "Biweekly", "Monthly", "Yearly"]

function loadBudget(id) {
    fetch('/data/budget-expenses?id=' + id).then(response => response.json()).then((responseData) => {
        console.log(responseData);

        const budget = responseData.budget;
        const expenses = responseData.expenses;

        document.getElementById('details-name').textContent = budget.name;
        document.getElementById('fraction-top').textContent = budget.usedAmount;
        document.getElementById('fraction-bottom').textContent = budget.amount;
        document.getElementById('details-description').textContent = budget.description;
        document.getElementById('details-date').textContent = budget.startDate;
        document.getElementById('details-date-end').textContent = budget.endDate;


        if (budget.recurring) {
            document.getElementById('recur-img').src = 'static/images/recurIcon.svg';

            const period = PERIODS[budget.budgetPeriod].toLocaleLowerCase();
            document.getElementById('recur-description').textContent = "This budget recurs " + period + ".";
        }


        
    });
}