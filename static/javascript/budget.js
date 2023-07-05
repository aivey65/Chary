const PERIODS = ["Daily", "Weekly", "Biweekly", "Monthly", "Yearly"]

function loadBudget(id) {
    fillProfilePics(); // Get the profile images on the page filled.

    fetch('/data/budget-expenses?id=' + id).then(response => response.json()).then((responseData) => {
        console.log(responseData)
        const budget = responseData.budget;
        const expenses = responseData.expenses;

        // Replace placeholder SVG
        const svg = document.getElementById('details-svg-container');
        svg.innerHTML = "";
        svg.append(generateCurveProgress(budget.usedAmount, budget.amount));
        
        document.getElementById('details-name').textContent = budget.name;
        document.getElementById('fraction-top').textContent = responseData.currency + formatNumber(budget.usedAmount);
        document.getElementById('fraction-bottom').textContent = responseData.currency + formatNumber(budget.amount);
        
        if (budget.description == "") {
            document.getElementById('details-description').textContent = "None";
        }
        else {
            document.getElementById('details-description').textContent = budget.description;
        }
        
        const options = { year: 'numeric', month: 'long', day: 'numeric' }; // Date formatting

        const startDate = new Date(budget.startDate);
        document.getElementById('details-date').textContent = startDate.toLocaleDateString('en-us', options);
        
        if (budget.endDate == "") {
            document.getElementById('details-date-end').textContent = "None";
        } else {
            const endDate = new Date(budget.endDate);
            document.getElementById('details-date-end').textContent = endDate.toLocaleDateString('en-us', options);
        }

        document.getElementById('details-edit').onclick = () => {
            window.location.href = "/form/update-budget?id=" + id;
        };

        if (budget.recurring) {
            document.getElementById('recur-img').src = 'static/images/recurIcon.svg';

            const period = PERIODS[budget.budgetPeriod].toLocaleLowerCase();
            document.getElementById('recur-description').textContent = "This budget recurs " + period;
        }

        // Create 'expenses' section

        document.getElementById('expense-container').append(generateTableUI(0, expenses, responseData.currency));

        // Hide placeholders
        hidePlaceholders();
    });
}

function dashboardBudgetAction() {
    window.location.assign("/dashboard");
}