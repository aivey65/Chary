// Patterns for testing currency symbols and numbers
const ScReCurrency = /[\$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20BD\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6]/;
const ScReName = /^[A-Za-z0-9 _]*[A-Za-z0-9][A-Za-z0-9 _]*$/;
const numbers = /^\d*\.?\d+$/;

// Flags
var possibleIndependantChange = false;

// Meta Data
currentStartDate = null;

// Specific value arrays
const colorList = ["#AE1326", "#34E1EB", "#33EB7C", "#E8EB34", "#EB8F34", "#C16BCF"];
const imageList = ["undraw_dog", "undraw_person1", "undraw_person2", "undraw_person3", "undraw_person4", "undraw_cat"];

function userFormLoad() {
    fillProfilePics();
}

function independantChange() {
    possibleIndependantChange = true;
}

function formLoad(startDate=null, configureDate=false) {
    fillProfilePics();
    currentStartDate = startDate;

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

function checkNumber(entity) {
    entity = Number(entity)
    return (entity >= 0 && entity <= 5)
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
    const username = document.getElementById("name").value;
    const currency = document.getElementById("currency").value;
    const image = document.querySelector("input[name='image-radio']:checked").value;
    const color = document.querySelector("input[name='color-radio']:checked").value;
    var alertSection = document.getElementById("alert-section");
    alertSection.innerHTML = "";

    if(!checkCurrency(currency)) {
        message = "- The currency you entered is invalid. Make sure you are entering a recognized currency symbol.";
        updateAlertSection(message);
        window.scrollTo({top: 0, behavior: 'smooth'});
        return;
    }

    if(!checkUsername(username)) {
        message = "- This username contains invalid characters. Use only letters and numbers.";
        updateAlertSection(message);
        window.scrollTo({top: 0, behavior: 'smooth'});
        return;
    }

    if (!checkNumber(image) || !checkNumber(color)) {
        message = "- Something went wrong when submitting this form. Please try again.";
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
            "username": username,
            "profileImage": imageList[image],
            "profileColor": colorList[color],
            "currency": currency,
        })
    }).then((response) => response.json()).then((responseData) => {
        if (responseData.status != 201) {
            message = "- Error: " + String(responseData.message) + ". Please try again later.";
            updateAlertSection(message);
            window.scrollTo({top: 0, behavior: 'smooth'});
            return;
        } else {
            window.location = "/dashboard?refresh=true&tab=overview";
        }
    })
}

function submitBudgetForm(method=null) {
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
                method: method,
                name: document.getElementById("name").value,
                description: document.getElementById("description").value,
                amount: document.getElementById("amount").value,
                radio: document.querySelector("input[name='radio']:checked").value,
                start: document.getElementById("start").value,
                end: document.getElementById("end").value,
                current: currentStartDate,
                recurring: document.querySelector("input[name='recurring']:checked").value,
            })
        }).then((response) => response.json()).then((responseData) => {
            if (responseData.status != 201) {
                message = "- Error: " + String(responseData.message) + ". Please revise your budget and try again.";
                updateAlertSection(message);
                window.scrollTo({top: 0, behavior: 'smooth'});
                return
            } else {
                window.location = "/dashboard?refresh=true&tab=budgets";
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
                message = "- Error: " + String(responseData.message) + ". Please revise your budget and try again.";
                updateAlertSection(message);
                window.scrollTo({top: 0, behavior: 'smooth'});
                return
            } else {
                window.location = "/dashboard?refresh=true&tab=budgets";
            }
        })
    }
}

function submitExpenseForm(method=null) {
    const expenseAmount = document.getElementById('amount');
    const alertSection = document.getElementById('alert-section');
    alertSection.innerHTML = "";

    if(!checkAmount(expenseAmount.value)) {
        message = "- The expense amount you entered is invalid. Make sure you are only entering numbers and one decimal point (Example: 123.45).";
        updateAlertSection(message);
        window.scrollTo({top: 0, behavior: 'smooth'});
        return;
    }

    const expenseId = document.getElementById('id');

    if (expenseId) {
        console.log(currentStartDate)
        fetch('/data/update-expense', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: expenseId.value,
                method: method,
                name: document.getElementById("name").value,
                description: document.getElementById("description").value,
                amount: document.getElementById("amount").value,
                radio: document.querySelector("input[name='radio']:checked").value,
                start: document.getElementById("start").value,
                end: document.getElementById("end").value,
                current: currentStartDate,
                recurring: document.querySelector("input[name='recurring']:checked").value,
                category: document.getElementById("category").value
            })
        }).then((response) => response.json()).then((responseData) => {
            if (responseData.status != 201) {
                message = "- Error: " + String(responseData.message) + ". Please revise your expense and try again.";
                updateAlertSection(message);
                window.scrollTo({top: 0, behavior: 'smooth'});
                return
            } else {
                window.location = "/dashboard?refresh=true&tab=expenses";
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
                message = "- Error: " + String(responseData.message) + ". Please revise your expense and try again.";
                updateAlertSection(message);
                window.scrollTo({top: 0, behavior: 'smooth'});
                return
            } else {
                window.location = "/dashboard?refresh=true&tab=expenses";
            }
        });
    }
}

/*
 * @param method: String
 *      - "all", "one", or "future", depending on how the user is choosing to update certain fields.
*/
function submitEarningForm(method=null) {
    const earningAmount = document.getElementById('amount');
    const alertSection = document.getElementById('alert-section');
    alertSection.innerHTML = "";

    if(!checkAmount(earningAmount.value)) {
        message = "- The earning amount you entered is invalid. Make sure you are only entering numbers and one decimal point (Example: 123.45).";
        updateAlertSection(message);
        window.scrollTo({top: 0, behavior: 'smooth'});
        return;
    }

    const earningId = document.getElementById('id');

    if (earningId) {
        console.log(currentStartDate)
        fetch('/data/update-earning', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: earningId.value,
                method: method,
                name: document.getElementById("name").value,
                description: document.getElementById("description").value,
                amount: document.getElementById("amount").value,
                radio: document.querySelector("input[name='radio']:checked").value,
                start: document.getElementById("start").value,
                end: document.getElementById("end").value,
                current: currentStartDate,
                recurring: document.querySelector("input[name='recurring']:checked").value,

            })
        }).then((response) => response.json()).then((responseData) => {
            if (responseData.status != 201) {
                message = "- Error: " + String(responseData.message) + ". Please revise your earning and try again.";
                updateAlertSection(message);
                window.scrollTo({top: 0, behavior: 'smooth'});
                return;
            } else {
                window.location = "/dashboard?refresh=true&tab=earnings";
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
            if (responseData.status != 201) {
                message = "- Error: " + String(responseData.message) + " Please revise your earning and try again.";
                updateAlertSection(message);
                window.scrollTo({top: 0, behavior: 'smooth'});
                return
            } else {
                window.location = "/dashboard?refresh=true&tab=earnings";
            }
        });
    }
}

/////////////////////////////////////
// Confirm update method functions //
/////////////////////////////////////
function confirmUpdateMethod(entityType, isDelete=false) {
    // Create the confirmation message depending on if the user is updating or deleting
    var confirmationMessage = "";
    if (isDelete) {
        confirmationMessage = "Do you want to delete other occurances?";
    } else {
        confirmationMessage = "How would you like to update occurances?";
    }
    
    // If the user is updating (not deleting) and there has been no independant change made, or if the entity is not recurring, the update can happen without update methods.
    const recurringCheck = document.querySelector("input[name='recurring']:checked").value;
    if (isDelete && recurringCheck == "False") { // If the user is deleting, and it is not recurring, show normal delete warning
        confirmDelete(entityType);
    } else if (!isDelete && (!possibleIndependantChange || recurringCheck == "False")) { // If the user is updating, but there isn't an independant change or recurring is false
        callSubmit(String(entityType), "all");
    } else {
        const popupHeader = document.createElement("h3");
        popupHeader.id = "popup-header";
        popupHeader.textContent = confirmationMessage;

        const popupText = document.createElement("p");
        popupText.id = "popup-text";
        popupText.textContent = "NOTE: This action cannot be undone.";

        const popupOption1 = createImageRadioOption("all", "../static/images/UpdateAllGraphic.svg", "All Occurances");
        const popupOption2 = createImageRadioOption("one", "../static/images/UpdateOneGraphic.svg", "One Occurance");
        const popupOption3 = createImageRadioOption("future", "../static/images/UpdateFuture.svg", "Future Occurances");
        const popupOptions = document.createElement("div");
        popupOptions.id = "option-div-collection";
        popupOptions.append(popupOption1, popupOption2, popupOption3);

        const popupSubmit = document.createElement("button");
        popupSubmit.type = "submit";
        popupSubmit.textContent = "Submit";
        popupSubmit.classList.add("cta-button");
        popupSubmit.onsubmit = function() {
            popupWrapper.remove();
        }

        const popupCancel = document.createElement("button");
        popupCancel.textContent = "Cancel"
        popupCancel.onclick = function() {
            popupWrapper.remove();
        }

        const popupForm = document.createElement("form");
        popupForm.classList.add("update-method");
        popupForm.method = "post";
        popupForm.append(popupOptions, popupSubmit, popupCancel);

        const popup = document.createElement("div");
        popup.id = "popup";
        popup.append(popupHeader, popupForm, popupText);

        const popupWrapper = document.createElement("div");
        popupWrapper.id = "popup-wrapper";
        popupWrapper.append(popup);
        popupWrapper.addEventListener("click", (e) => {
            if (e.target == popupWrapper) {
                popupWrapper.remove();
            }
        });

        document.getElementById("acd-content").append(popupWrapper);

        if (isDelete) {
            popupForm.action = "javascript:finalizeDelete('" + String(entityType) + "')";
        } else {
            popupForm.action = "javascript:callSubmit('" + String(entityType) + "')";
        }
    }
}

function callSubmit(entityType, method=null) {
    if (method == null) {
        method = document.querySelector("input[name='method-radio']:checked").value;
    }

    if(entityType == "Budget") {
        submitBudgetForm(method);
    } else if (entityType == "Expense") {
        submitExpenseForm(method);
    } else if (entityType == "Earning") {
        submitEarningForm(method);
    }
}

function createImageRadioOption(id, imgUrl, text) {
    // First, create the input.
    const popupOption = document.createElement("input");
    popupOption.type = "radio";
    popupOption.name = "method-radio";
    popupOption.id = id;
    popupOption.value = id;
    popupOption.required = true;

    // Create the label that will contain a given image
    const optionLabel = document.createElement("label");
    optionLabel.htmlFor = id;
    optionLabel.classList.add(id + "-label", "label-update-method");

    const optionImg = document.createElement("img");
    optionImg.src = imgUrl;
    optionImg.classList.add("option-img");

    optionLabel.append(optionImg);

    const description = document.createElement("p");
    description.textContent = text;

    const optionDiv = document.createElement("div");
    optionDiv.classList.add("option-div");
    optionDiv.append(description, popupOption, optionLabel);

    return optionDiv;
}

//////////////////////////////////
// Delete item submit functions //
//////////////////////////////////
function confirmDelete(entityType) {
    var typeString;
    if (String(entityType) == "user") {
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
        finalizeDelete(entityType, "all");
    }
    deleteButton.classList.add("delete-button");
    popup.firstChild.append(deleteButton);

    document.getElementById("acd-content").append(popup);
}

function finalizeDelete(entityType, method=null) {
    if (method == null) {
        method = document.querySelector("input[name='method-radio']:checked").value;
    }

    var idToDelete = document.getElementById("id");
    if (idToDelete) {
        idToDelete = idToDelete.value;
    } else {
        idToDelete = "";
    }

    fetch('/data/delete-' + String(entityType), {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            id: idToDelete,
            method: method,
            current: currentStartDate,
        })
    }).then(response => response.json()).then((responseData) => {
        if (responseData.status != 200) {
            message = "- Error: " + String(responseData.message) + " Please try again later."
            updateAlertSection(message);
            window.scrollTo(0, 0);
            return
        } else {
            if (String(entityType) == "user") {
                window.location = "/";
            } else {
                window.location = "/dashboard?refresh=true&tab=" + String(entityType) + "s";
            }
        }
    })
}