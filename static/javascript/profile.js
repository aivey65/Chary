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
    alert("warning!");
}