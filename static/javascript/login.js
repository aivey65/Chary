////////////////////
// Scroll Paralax //
////////////////////
// Paralax scrolling method adapted from https://stackoverflow.com/questions/29240028/css-make-a-background-image-scroll-slower-than-everything-else
window.addEventListener('scroll', () => {
    const scrolltotop = window.pageYOffset;
    var factor = -0.5;
    var yvalue = scrolltotop * factor;
    document.body.style.backgroundPosition = "left " + yvalue + "px";
});

window.addEventListener("load", () => {
    setTimeout(() => {
        showCookieConsent(true);
    }, 1000);
})

function updateAlertSection(message, add=false) {
    const alertSection = document.getElementById('alert-section');
    if (!add) {
        alertSection.innerHTML = "";
    }

    const newAlert = document.createElement('h4');
    newAlert.textContent = message;

    alertSection.appendChild(newAlert);
}

function submitSignupForm() {
    const alertSection = document.getElementById('alert-section');
    alertSection.innerHTML = "";

    if (document.getElementById('pass').value != document.getElementById("pass-check").value) {
        updateAlertSection("- Passwords do not match. Re-enter them and try again.");
        window.scrollTo(0, 0);
        return;
    }

    fetch('/data/create-user/chary', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email: document.getElementById('email').value,
            password: document.getElementById('pass').value,
        })
    }).then((response) => response.json()).then((responseData) => {
        if (responseData.status != 201) {
            const message = "- Error: " + String(responseData.message)
            updateAlertSection(message);
            window.scrollTo(0, 0);
            return;
        } else {
            window.location = "/enter";
        }
    })
}

function submitLoginForm() {
    const alertSection = document.getElementById('alert-section');
    alertSection.innerHTML = "";

    fetch('/chary/auth/validate', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email: document.getElementById('email').value,
            password: document.getElementById('pass').value,
        })
    }).then((response) => response.json()).then((responseData) => {
        if (responseData.status != 200) {
            const message = "- Error: " + String(responseData.message)
            updateAlertSection(message);
            window.scrollTo(0, 0);
            return;
        } else {
            window.location = "/enter";
        }
    })
}