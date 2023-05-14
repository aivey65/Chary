function formLoad() {
    const recurRadio = document.querySelectorAll('input[name="recurring"]');
    for (const option in recurRadio) {
        console.log(option)
        option.addEventListener("change", configureRecurOptions)
    }
}

function submitBudgetForm() {
    fetch('/data/budgets').then(response => response.json()).then((responseData) => {
        categories = responseData.categories

        console.log(categories);
    })
}

function configureRecurOptions() {
    if (this.checked && this.value == 'True') {
        // Show options for recurring
        recurDiv = document.getElementById('recurring-items');
        recurDiv.display = block;

        // Make period radio buttons required
        options = document.getElementsByName('radio');
        for (option in options) {
            option.required = true;
        }
    } else if (this.checked && this.value == 'False') {
        // Show options for recurring
        recurDiv = document.getElementById('recurring-items');
        recurDiv.display = None;

        // Make period radio buttons not required
        options = document.getElementsByName('radio');
        for (option in options) {
            option.required = false;
        }
    }
}
