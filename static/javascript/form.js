// Patterns for testing currency symbols and numbers
ScReCurrency = /[\$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20BD\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6]/;
ScReName = /^[A-Za-z0-9 _]*[A-Za-z0-9][A-Za-z0-9 _]*$/
numbers = /^\d*\.?\d+$/;

function userFormLoad() {
    fillProfilePics();
}

function formLoad(configureDate=false) {
    fillProfilePics();

    if (configureDate) {
        const dateInputs = document.querySelectorAll('input[type="date"]'); // The date input needs to be adjusted when the date changes
        dateInputs.forEach(input => {
            input.addEventListener("change", configureDateInput);
        })
        const radioPeriod = document.querySelectorAll("input[name='radio']"); // The date input also needs to be adjusted when the period changes
        radioPeriod.forEach(period => {
            period.addEventListener("change", configureDateInput);
        })
    }

    configureRecurOptions();
    const recurRadio = document.querySelectorAll('input[name="recurring"]');
    recurRadio.forEach(option => {
        option.addEventListener("change", configureRecurOptions);
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
    return ScReCurrency.test(currency);
}

function checkUsername(username) {
    return ScReName.test(username);
}

function checkAmount(amount) {
    return numbers.test(amount);
}

function configureDateInput() {
    const period = document.querySelector("input[name='radio']:checked").value;
    const start = document.getElementById("start");
    const end =  document.getElementById("end");

    // Creating UTC dates
    var startDate = null;
    var endDate = null;
    if (start.value != "") {
        var UTCDate = start.value.split('-');
        UTCDate[1] = UTCDate[1] - 1;
        startDate = new Date(...UTCDate);
    }
    if (end.value != "") {
        var UTCDate = end.value.split('-');
        UTCDate[1] = UTCDate[1] - 1;
        endDate = new Date(...UTCDate);
    }
    
    if (period == 1 || period == 2) { // Weekly
        if (startDate) {
            startDate = new Date(startDate.setDate(startDate.getDate() - startDate.getDay()));
            start.value = startDate.toLocaleDateString("en-CA", { timeZone: 'UTC' });
        }
        if (endDate) {
            endDate = new Date(endDate.setDate(endDate.getDate() - endDate.getDay() + 6));
            end.value = endDate.toLocaleDateString("en-CA", { timeZone: 'UTC' });
        }
    } else if (period == 3) { // Monthly
        if (startDate) {
            startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
            start.value = startDate.toLocaleDateString("en-CA", { timeZone: 'UTC' });
        }
        if (endDate) {
            endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
            end.value = endDate.toLocaleDateString("en-CA", { timeZone: 'UTC' });
        }
    } else if (period == 4) { // Yearly
        if (startDate) {
            startDate = new Date(startDate.getFullYear(), 0, 1);
            start.value = startDate.toLocaleDateString("en-CA", { timeZone: 'UTC' });
        }
        if (endDate) {
            endDate = new Date(endDate.getFullYear(), 11, 31);
            end.value = endDate.toLocaleDateString("en-CA", { timeZone: 'UTC' });
        }
    }
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
function submitUserForm() {
    const username = document.getElementById("name");
    const currency = document.getElementById("currency");
    alertSection.innerHTML = "";

    if(!checkCurrency(currency.value)) {
        message = "- The currency you entered is invalid. Make sure you are entering a recognized currency symbol.";
        updateAlertSection(message);
        window.scrollTo({top: 0, behavior: 'smooth'});
        return;
    }

    if(!checkAmount(budgetAmount.value)) {
        message = "- The budget amount you entered is invalid. Make sure you are only entering numbers and one decimal point (Example: 123.45).";
        updateAlertSection(message);
        window.scrollTo({top: 0, behavior: 'smooth'});
        return;
    }

    fetch('/data/update-user', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            username: username.value,
            profileImage: document.querySelector("input[name='image-radio']:checked").value,
            profileColor: document.querySelector("input[name='color-radio']:checked").value,
            currency: currency.value,
        })
    }).then((response) => response.json()).then((responseData) => {
        if (responseData.status != 201) {
            message = "- Error: " + String(responseData.message) + ". Please revise your budget and try again."
            updateAlertSection(message);
            window.scrollTo({top: 0, behavior: 'smooth'});
            return
        } else {
            window.location = "/dashboard?refresh=true&tab=budgets"
        }
    })
}

function submitBudgetForm() {
    const budgetAmount = document.getElementById('amount');
    const alertSection = document.getElementById('alert-section');
    alertSection.innerHTML = "";

    if(!checkAmount(budgetAmount.value)) {
        message = "- The budget amount you entered is invalid. Make sure you are only entering numbers and one decimal point (Example: 123.45).";
        updateAlertSection(message);
        window.scrollTo({top: 0, behavior: 'smooth'});
        return;
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
                window.scrollTo({top: 0, behavior: 'smooth'});
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
                window.scrollTo({top: 0, behavior: 'smooth'});
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
        window.scrollTo({top: 0, behavior: 'smooth'});
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
                window.scrollTo({top: 0, behavior: 'smooth'});
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
                window.scrollTo({top: 0, behavior: 'smooth'});
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
        window.scrollTo({top: 0, behavior: 'smooth'});
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
                window.scrollTo({top: 0, behavior: 'smooth'});
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
                window.scrollTo({top: 0, behavior: 'smooth'});
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
function confirmDelete(entityType) {
    var typeString;
    if (entityType == "user") {
        typeString = "account";
    } else {
        typeString = String(entityType);
    }
    const confirmationMessage = "Are you sure you want to permanantly delete this " + typeString + "? This action cannot be undone.";
    const popup = createAlert(confirmationMessage);
    
    popup.addEventListener("click", (e) => {
        if (e.target == popup) {
            popup.remove();
        }
    });

    // Create option buttons for the popup
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.type = "button";
    cancelButton.style.display = "inline";
    cancelButton.onclick = function() {
        popup.remove();
    }
    cancelButton.classList.add("cancel-button");
    popup.firstChild.append(cancelButton);

    const trashcan = document.createElement("img");
    trashcan.src = "../static/images/TrashButton.svg";
    trashcan.alt = "Trash can icon";
    trashcan.classList.add("trash-icon");

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.append(trashcan);
    deleteButton.type = "button";
    deleteButton.style.display = "inline-flex";
    deleteButton.style.marginLeft = "var(--smallPad)";
    deleteButton.onclick = function() {
        popup.remove();
        finalizeDelete(entityType);
    }
    deleteButton.classList.add("delete-button");
    popup.firstChild.append(deleteButton);

    document.getElementById("acd-content").append(popup);
}

function budgetDeleteOptions() {
    finalizeDelete("budget")
}

function finalizeDelete(entityType) {
    const idToDelete = document.getElementById("id").value;

    console.log('/data/delete-' + entityType);
    fetch('/data/delete-' + entityType, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            id: idToDelete
        })
    }).then(response => response.json()).then((responseData) => {
        if (responseData.status != 200) {
            message = "- Error: " + String(responseData.message) + " Please try again later."
            updateAlertSection(message);
            window.scrollTo(0, 0);
            return
        } else {
            if (entityType == "user") {
                window.location = "/";
            } else {
                window.location = "/dashboard?refresh=true&tab=" + entityType + "s";
            }
        }
    })
}