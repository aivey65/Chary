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

    items = document.getElementsByClassName('recurring-items');
    options = document.getElementsByName('radio');

    if (recurTrue.checked) {
        // Show options for recurring
        for (const recurItem of items) {
            recurItem.style.display = "flex";
        }

        // Make period radio buttons required
        for (const option of options) {
            option.required = true;
        };
    } else if (recurFalse.checked) {
        // Hide options for recurring
        for (const recurItem of items) {
            recurItem.style.display = "none";
        }

        // Make period radio buttons not required
        for (const option of options) {
            option.required = false;
        };
    } else {
        // Hide options for recurring when nothing is checked yet
        for (const recurItem of items) {
            recurItem.style.display = "none";
        }

        // Make period radio buttons not required
        for (const option of options) {
            option.required = false;
        };
    }
}

/////////////////////////////////////////
// Create/Update form submit functions //
/////////////////////////////////////////

function submitUserForm(e) {

}

function submitBudgetForm() {
    const budgetAmount = document.getElementById('amount');
    const alertSection = document.getElementById('alert-section');
    alertSection.innerHTML = "";

    if(!checkAmount(budgetAmount.value)) {
        message = "- The budget amount you entered is invalid. Make sure you are only entering numbers and one decimal point (Example: 123.45)."
        updateAlertSection(message);
        window.scrollTo(0, 0);
        return
    }

    const budgetId = document.getElementById('id');

    if (budgetId) {
        fetch('/data/update-budget', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: budgetId.value,
                name: document.getElementById("name").value,
                description: document.getElementById("description").value,
                amount: document.getElementById("amount").value,
                radio: document.querySelector("input[name='radio']:checked").value,
                start: document.getElementById("start").value,
                end: document.getElementById("end").value,
                recurring: document.querySelector("input[name='recurring']:checked").value,
            })
        }).then((response) => response.json()).then((responseData) => {
            if (responseData.status != 201) {
                message = "- Error: " + String(responseData.message) + ". Please revise your budget and try again."
                updateAlertSection(message);
                window.scrollTo(0, 0);
                return
            } else {
                window.location = "/dashboard?refresh=true&tab=budgets"
            }
        })
    } else {
        fetch('/data/create-budget', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: document.getElementById("name").value,
                description: document.getElementById("description").value,
                amount: document.getElementById("amount").value,
                radio: document.querySelector("input[name='radio']:checked").value,
                start: document.getElementById("start").value,
                end: document.getElementById("end").value,
                recurring: document.querySelector("input[name='recurring']:checked").value,
            })
        }).then((response) => response.json()).then((responseData) => {
            if (responseData.status != 201) {
                message = "- Error: " + String(responseData.message) + ". Please revise your budget and try again."
                updateAlertSection(message);
                window.scrollTo(0, 0);
                return
            } else {
                window.location = "/dashboard?refresh=true&tab=budgets"
            }
        })
    }
}

function submitExpenseForm() {
    const expenseAmount = document.getElementById('amount');
    const alertSection = document.getElementById('alert-section');
    alertSection.innerHTML = "";

    if(!checkAmount(expenseAmount.value)) {
        message = "- The expense amount you entered is invalid. Make sure you are only entering numbers and one decimal point (Example: 123.45)."
        updateAlertSection(message);
        window.scrollY(0);
    }

    const expenseId = document.getElementById('id');

    if (expenseId) {
        fetch('/data/update-expense', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: expenseId.value,
                name: document.getElementById("name").value,
                description: document.getElementById("description").value,
                amount: document.getElementById("amount").value,
                radio: document.querySelector("input[name='radio']:checked").value,
                start: document.getElementById("start").value,
                end: document.getElementById("end").value,
                recurring: document.querySelector("input[name='recurring']:checked").value,
                category: document.getElementById("category").value
            })
        }).then((response) => response.json()).then((responseData) => {
            if (responseData.status != 201) {
                message = "- Error: " + String(responseData.message) + ". Please revise your expense and try again."
                updateAlertSection(message);
                window.scrollTo(0, 0);
                return
            } else {
                window.location = "/dashboard?refresh=true&tab=expenses"
            }
        });
    } else {
        fetch('/data/create-expense', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: document.getElementById("name").value,
                description: document.getElementById("description").value,
                amount: document.getElementById("amount").value,
                radio: document.querySelector("input[name='radio']:checked").value,
                start: document.getElementById("start").value,
                end: document.getElementById("end").value,
                recurring: document.querySelector("input[name='recurring']:checked").value,
                category: document.getElementById("category").value
            })
        }).then((response) => response.json()).then((responseData) => {
            if (responseData.status != 201) {
                message = "- Error: " + String(responseData.message) + ". Please revise your expense and try again."
                updateAlertSection(message);
                window.scrollTo(0, 0);
                return
            } else {
                window.location = "/dashboard?refresh=true&tab=expenses"
            }
        });
    }
}

function submitEarningForm() {
    const earningAmount = document.getElementById('amount');
    const alertSection = document.getElementById('alert-section');
    alertSection.innerHTML = "";

    if(!checkAmount(earningAmount.value)) {
        message = "- The earning amount you entered is invalid. Make sure you are only entering numbers and one decimal point (Example: 123.45)."
        updateAlertSection(message);
        window.scrollY(0);
    }

    const earningId = document.getElementById('id');

    if (earningId) {
        fetch('/data/update-earning', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: earningId.value,
                name: document.getElementById("name").value,
                description: document.getElementById("description").value,
                amount: document.getElementById("amount").value,
                radio: document.querySelector("input[name='radio']:checked").value,
                start: document.getElementById("start").value,
                end: document.getElementById("end").value,
                recurring: document.querySelector("input[name='recurring']:checked").value,

            })
        }).then((response) => response.json()).then((responseData) => {
            if (responseData.status != 201) {
                message = "- Error: " + String(responseData.message) + ". Please revise your earning and try again."
                updateAlertSection(message);
                window.scrollTo(0, 0);
                return
            } else {
                window.location = "/dashboard?refresh=true&tab=earnings"
            }
        });
    } else {
        fetch('/data/create-earning', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
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
            console.log(responseData)
            if (responseData.status != 201) {
                message = "- Error: " + String(responseData.message) + " Please revise your earning and try again."
                updateAlertSection(message);
                window.scrollTo(0, 0);
                return
            } else {
                window.location = "/dashboard?refresh=true&tab=earnings"
            }
        });
    }
}

//////////////////////////////////
// Delete item submit functions //
//////////////////////////////////
function deleteUser() {
    console.log("delete pressed");
    return
    const confirmationMessage = "Are you sure you want to permanantly delete your account? This action cannot be undone.";
    createAlert(confirmationMessage);
}

function deleteBudget() {
    console.log("delete pressed");
    return
    const confirmationMessage = "Are you sure you want to permanantly delete this budget? This action cannot be undone.";
    createAlert(confirmationMessage);
}

function deleteExpense() {
    const confirmationMessage = "Are you sure you want to permanantly delete this expense? This action cannot be undone.";
    createAlert(confirmationMessage);
}

function deleteEarning() {
    const confirmationMessage = "Are you sure you want to permanantly delete this earning? This action cannot be undone.";
    createAlert(confirmationMessage);
}