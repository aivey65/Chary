function loadProfile() {
    fillProfilePics(); // Get the profile images on the page filled.

    fetch('/data/user').then(response => response.json()).then((responseData) => {
        const profile = responseData.data;
        document.getElementById('color-block').style.backgroundColor = profile.profileColor;
        document.getElementById('user-name').innerText = profile.username;
        document.getElementById('user-join-date').innerText = "Joined " + new Date(profile.joinDate).toLocaleDateString("en-CA", getDateFormattingOptions());
        document.getElementById('user-email').innerText = profile.email;
        document.getElementById('user-currency').innerText = profile.currency;
        document.getElementById('profile-image').src = "../static/images/profileImages/" + profile.profileImage + ".svg"

        // Hide placeholder content
        hidePlaceholders();
    });
}

function loadOverviewTab() {
    window.location.href = "/dashboard?refresh=false&tab=overview";
}

function loadBudgetTab() {
    window.location.href = "/dashboard?refresh=false&tab=budgets";
}

function loadExpenseTab() {
    window.location.href = "/dashboard?refresh=false&tab=expenses";
}

function loadEarningTab () {
    window.location.href = "/dashboard?refresh=false&tab=earnings";
}

function goToProfileForm() {
    window.location.href = "/form/update-user";
}

function deleteAccountPopup() {
    // Create popup to confirm that the user wants to delete their account.
    const confirmationMessage = "Are you sure you want to permanantly delete your account? This action cannot be undone.";
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
    deleteButton.textContent = "DELETE ACCOUNT";
    deleteButton.append(trashcan);
    deleteButton.type = "button";
    deleteButton.style.display = "inline-flex";
    deleteButton.style.marginLeft = "var(--smallPad)";
    deleteButton.onclick = function() {
        popup.remove();
        deleteAccountConfirmed();
    }
    deleteButton.classList.add("delete-button");
    popup.firstChild.append(deleteButton);

    document.getElementById("page-content").append(popup);
}

function deleteAccountConfirmed() {
    fetch('/data/delete-user', {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        }
    }).then(response => response.json()).then((responseData) => {
        if (responseData.status != 200) {
            message = "- Error: " + String(responseData.message) + " Please try again later."
            updateAlertSection(message);
            window.scrollTo(0, 0);
            return
        }
    });
}