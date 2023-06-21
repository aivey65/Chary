// Patterns for testing currency symbols and numbers
ScRe = /[\$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20BD\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6]/;
numbers = /^\d*\.?\d+$/;

function formLoad() {
    configureRecurOptions();
    fillProfilePics();

    const recurRadio = document.querySelectorAll('input[name="recurring"]');
    recurRadio.forEach(option => {
        option.addEventListener("change", configureRecurOptions)
    });
}

function updateAlertSection(message, add=false) {
    alertSection = document.getElementById('alert-section');
    if (!add) {
        alertSection.innerHTML = "";
    }

    newAlert = document.createElement('h4');
    newAlert.textContent = message;

    alertSection.appendChild(newAlert);
}

function checkCurrency(currency) {
    return ScRe.test(currency);
}

function checkAmount(amount) {
    return numbers.test(amount);
}

function configureRecurOptions() {
    recurTrue = document.getElementById('recurring-true');
    recurFalse = document.getElementById('recurring-false');

    if (recurTrue.checked) {
        // Show options for recurring
        recurDiv = document.getElementById('recurring-items');
        recurDiv.style.display = "block";

        // Make period radio buttons required
        options = document.getElementsByName('radio');
        options.forEach(option => {
            option.required = true;
        });
    } else if (recurFalse.checked) {
        // Show options for recurring
        recurDiv = document.getElementById('recurring-items');
        recurDiv.style.display = "none";

        // Make period radio buttons not required
        options = document.getElementsByName('radio');
        options.forEach(option => {
            option.required = false;
        });
    }
}

//////////////////////////////////
// Create form submit functions //
//////////////////////////////////

function submitUserCreateForm(e) {

}

function submitBudgetCreateForm(e) {
    e.preventDefault();

    budgetAmount = document.getElementById('amount');
    alertSection = document.getElementById('alert-section');
    alertSection.innerHTML = "";

    if(!checkAmount(budgetAmount.value)) {
        message = "- The budget amount you entered is invalid. Make sure you are only entering numbers and one decimal point (Ex: 123.45)."
        updateAlertSection(message);
        window.scrollY(0);
    }

    fetch('/data/create-budget', {
        method: "POST",
        body: JSON.stringify({
            name: document.getElementById("name").value,
            description: document.getElementById("description").value,
            amount: document.getElementById("amount").value,
            radio: document.querySelector("input[name='radio']:checked").value,
            start: document.getElementById("start").value,
            end: document.getElementById("end").value,
            recurring: document.querySelector("input[name='recurring']:checked").value,

        })
    }).then(response => response.json()).then((responseData) => {
        console.log(responseData);
    })
}

function submitExpenseCreateForm() {
    expenseAmount = document.getElementById('amount');
    alertSection = document.getElementById('alert-section');
    alertSection.innerHTML = "";

    if(!checkAmount(expenseAmount.value)) {
        message = "- The budget amount you entered is invalid. Make sure you are only entering numbers and one decimal point (Ex: 123.45)."
        updateAlertSection(message);
        window.scrollY(0);
    }

    try {
        fetch('/data/create-expense', {
            method: "POST",
            body: JSON.stringify({
                name: document.getElementById("name").value,
                description: document.getElementById("description").value,
                amount: document.getElementById("amount").value,
                radio: document.querySelector("input[name='radio']:checked").value,
                start: document.getElementById("start").value,
                end: document.getElementById("end").value,
                recurring: document.querySelector("input[name='recurring']:checked").value,

            })
        }).then(response => response.json()).then((responseData) => {
            if (responseData.status == 200) {
                window.location = "/dashboard?refresh=true&tab=expenses";
            }
        })
    } catch (e) {
        console.log(e)
    }
    
    return false;
}

function submitEarningCreateForm(e) {
    e.preventDefault();

    budgetAmount = document.getElementById('amount');
    alertSection = document.getElementById('alert-section');
    alertSection.innerHTML = "";

    if(!checkAmount(budgetAmount.value)) {
        message = "- The budget amount you entered is invalid. Make sure you are only entering numbers and one decimal point (Ex: 123.45)."
        updateAlertSection(message);
        window.scrollY(0);
    }

    fetch('/data/create-earning', {
        method: "POST",
        body: JSON.stringify({
            name: document.getElementById("name").value,
            description: document.getElementById("description").value,
            amount: document.getElementById("amount").value,
            radio: document.querySelector("input[name='radio']:checked").value,
            start: document.getElementById("start").value,
            end: document.getElementById("end").value,
            recurring: document.querySelector("input[name='recurring']:checked").value,

        })
    }).then(response => response.json()).then((responseData) => {
        console.log(responseData);
    })
}

//////////////////////////////////
// Update form submit functions //
//////////////////////////////////

function submitUserUpdateForm(e) {
    
}

function submitBudgetUpdateForm(e) {
    fetch('/data/budgets').then(response => response.json()).then((responseData) => {
        categories = responseData.categories

        console.log(categories);
    })
}

function submitExpenseUpdateForm(e) {

}

function submitEarningUpdateForm(e) {

}
