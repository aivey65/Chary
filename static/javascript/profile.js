function loadProfile() {
    fillProfilePics(); // Get the profile images on the page filled.

    fetch('/data/user').then(response => response.json()).then((responseData) => {
        const profile = responseData.data;
        document.getElementById('user-name').innerText = profile.username;
        document.getElementById('user-join-date').innerText = profile.joinDate;
        document.getElementById('user-email').innerText = profile.email;
        document.getElementById('user-currency').innerText = profile.currency;
        document.getElementById('profile-image').src = "../static/images/profileImages/" + profile.profileImage + ".svg"

        // Hide placeholder content
        hidePlaceholders();
    });
}