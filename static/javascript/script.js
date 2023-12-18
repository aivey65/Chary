const DATA_COLORS = ["#C3B3E5", "#B9E2F3", "#BFD0EE", "#E7B1BE", "#DAB1E7", "#D293DC", "#DD8E9C", "#E5988D", "#eda27d", "#f6bf89", "#fcdd9c", "#fffab6", "#eaf6a0", "#cef38f", "#acf182", "#96F193"];
const COLORS_GREEN = "#33EB7C";
const COLORS_NAVY = "#2C2440";
const COLORS_RED = "#AE1326";
const COLORS_PINK = "#CE6C75";
const COLORS_DARK = "#1E0206";
const COLORS_LIGHT = "#f6d4d2";
const COLORS_GREY = "#8E7c89";

// Date formatting
function getDateFormattingOptions(long=true) {
    return { year: 'numeric', month: 'short', day: 'numeric' };
}

function getShortDateFormattingOptions(year=false) {
    if (year) {
        return { year: 'numeric', month: 'short', day: 'numeric' };
    } else {
        return { month: 'short', day: 'numeric' };
    }
}

function getUTCDateFromString(date) {
    if (date instanceof Date) {
        return new Date(date);
    }
    
    var UTCDate = String(date).split('-');
    UTCDate[1] = UTCDate[1] - 1;
    return new Date(...UTCDate);
}

function getISOFormatDate(date) {
    var yyyy = date.getFullYear().toString();
    var mm = (date.getMonth()+1).toString();
    var dd  = date.getDate().toString();

    if (mm.length == 1) {
        mm = "0" + mm;
    }

    if (dd.length == 1) {
        dd = "0" + dd;
    }

    return yyyy + "-" + mm + "-" + dd;
}

/**
 * Returns a map with two properties:
 *      labels: list of date strings
 *      values: list of ints
 * 
 * Both lists are of length 7 for the 7 days of the week.
 */
function getEmptySevenDaysMap(startDate) {
    startDate = getUTCDateFromString(startDate);

    var weekDates = [];
    var weekLabels = [];
    var weekValues = [];
    var formattingOptions = getShortDateFormattingOptions();

    for (var i = 6; i >= 0; i--) {
        var tempDate = new Date(startDate);
        tempDate.setDate(startDate.getDate() - i);

        weekDates.push({
            "startDate": tempDate,
            "endDate": tempDate
        });
        weekLabels.push(tempDate.toLocaleDateString('en-us', formattingOptions))
        weekValues.push(0);
    }

    const weekMap = {
        "ranges": weekDates,
        "labels": weekLabels,
        "values": weekValues
    }

    return weekMap;
}

function getEmptyFourWeeksMap(startDate) {
    var UTCStartDate = getUTCDateFromString(startDate);
    startDate = new Date(UTCStartDate.setDate(UTCStartDate.getDate() - UTCStartDate.getDay()));
    var endDate = new Date(UTCStartDate.setDate(UTCStartDate.getDate() + (6 - UTCStartDate.getDay())));

    var weekDates = [];
    var weekLabels = [];
    var weekValues = [];

    const formatting = getShortDateFormattingOptions(false);

    for (var i = 0; i < 4; i++) {
        var newStart = new Date(startDate)
        newStart.setDate(startDate.getDate() - (i * 7));

        var newEnd = new Date(endDate)
        newEnd.setDate(endDate.getDate() - (i * 7));

        weekDates.unshift({
            "startDate": newStart,
            "endDate": newEnd
        });
        weekLabels.unshift(newStart.toLocaleDateString("en-us", formatting) + " - " + newEnd.toLocaleDateString("en-us", formatting));
        weekValues.push(0);
    }

    const weekMap = {
        "ranges": weekDates,
        "labels": weekLabels,
        "values": weekValues
    };

    return weekMap;
}

function getEmptyMonthMap() {
    var monthValues = []
    for(var i = 0; i < 12; i++) {
        monthValues.push(0);
    }
    
    const monthMap = {
        "labels": [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"
        ],
        "values": monthValues
    }

    return monthMap;
}

function getEmptyFiveYearsMap(startDate) {
    var UTCStartDate = getUTCDateFromString(startDate);
    startDate = new Date(UTCStartDate.getFullYear(), 0, 1);
    var endDate = new Date(UTCStartDate.getFullYear(), 11, 31);

    var yearDates = [];
    var yearLabels = [];
    var yearValues = [];

    for (var i = 0; i < 5; i++) {
        var tempStart = new Date(startDate.getFullYear() - i, 0, 1);
        var tempEnd = new Date(endDate.getFullYear() - i, 11, 31);

        yearDates.unshift({
            "startDate": tempStart,
            "endDate": tempEnd
        });
        yearLabels.unshift(tempStart.getFullYear());
        yearValues.push(0);
    }

    const yearMap = {
        "ranges": yearDates,
        "labels": yearLabels,
        "values": yearValues
    }

    return yearMap;
}

// Navigation functions
function homeAction() {
    window.location = '/';
    closeMenu()
}

function bttAction() {
    window.scrollTo(0, 0);
    closeMenu()
}

function loginAction() {
    window.location = '/login';
    closeMenu()
}

function signupAction() {
    window.location = '/signup';
    closeMenu()
}

function dashboardAction() {
    window.location = '/dashboard';
    closeMenu()
}

function formatNumber(number, showDecimal=true) {
    if (number < 1000) {
        const numberFormatter = Intl.NumberFormat("en", { maximumFractionDigits: 2, notation: "compact", minimumFractionDigits: 2 });
        var formattedNumber = numberFormatter.format(number);
        return formattedNumber.replace(/\.00$/, '');
    } else {
        if (showDecimal) {
            const numberFormatter = Intl.NumberFormat("en", { maximumFractionDigits: 2, notation: "compact" });
        return numberFormatter.format(number);
        } else {
            const numberFormatter = Intl.NumberFormat("en", { maximumFractionDigits: 0, notation: "compact" });
            return numberFormatter.format(number);
        }
    }
    
}

// Function displays a message and 
function createAlert(message) {
    const popupHeader = document.createElement("h3");
    popupHeader.id = "popup-header";
    popupHeader.textContent = "WARNING ⚠️";

    const popupText = document.createElement("p");
    popupText.id = "popup-text";
    popupText.innerText = message;

    const popup = document.createElement("div");
    popup.id = "popup";
    popup.append(popupHeader, popupText);

    const popupWrapper = document.createElement("div");
    popupWrapper.id = "popup-wrapper";
    popupWrapper.append(popup);

    return popupWrapper
}

function createFiltersSection(type) {
    const period00 = document.createElement("option");
    period00.value = "-2";
    const period0 = document.createElement("option");
    period0.value = "-1";
    const period1 = document.createElement("option");
    period1.value = "0";
    const period2 = document.createElement("option");
    period2.value = "1";
    const period3 = document.createElement("option");
    period3.value = "3";
    const period4 = document.createElement("option");
    period4.value = "4";

    // Set options specific to the type of entity
    if (type == 'budgets') {
        // Set the default selected option
        period00.selected = true;

        // Set the option text
        period00.textContent = "Active Budgets";
        period0.textContent = "Inactive Budgets";
        period1.textContent = "Daily Budgets";
        period2.textContent = "Weekly Budgets";
        period3.textContent = "Monthly Budgets";
        period4.textContent = "Yearly Budgets";
    } else {   
        // Set the default selected option
        if (type == 'expenses' || type == 'earnings') {
            period4.selected = true;
        } else if (type == 'charts') {
            period3.selected = true;
        }

        // Set the option text
        period1.textContent = "Day View";
        period2.textContent = "Week View";
        period3.textContent = "Month View";
        period4.textContent = "Year View";
    }

    const dateSelector = document.createElement("input"); // Placed up here so that the value can be changed by the periodSelector
    const periodSelector = document.createElement("select");
    const upcomingSelector = document.createElement("select"); // Placed up here so that the value can be changed by the dateSelector

    periodSelector.id = "period-selector";
    periodSelector.title = "Select the type of time period you want to view";
    if (type == 'budgets') {
        periodSelector.append(period00, period0, period1, period2, period3, period4);
    } else {
        periodSelector.append(period1, period2, period3, period4);
    }
    periodSelector.addEventListener("change", () => {
        dateSelector.value = configureFilterDate(dateSelector.value, periodSelector.value);
        upcomingSelector.value = configureFilterUpcoming(dateSelector.value, periodSelector.value, upcomingSelector.value);
        updateData(type, periodSelector.value, dateSelector.value, upcomingSelector.value);
    });

    dateSelector.id = "date-selector";
    dateSelector.type = "date";
    dateSelector.title = "Select the start date for the period you want to view"
    dateSelector.value = configureFilterDate(getISOFormatDate(new Date()), periodSelector.value);
    dateSelector.addEventListener("change", () => {
        if (periodSelector.value == 4 || periodSelector.value == -1 || periodSelector.value == -2) {
            dateSelector.value = configureFilterDate(dateSelector.value, periodSelector.value, true);
        } else {
            dateSelector.value = configureFilterDate(dateSelector.value, periodSelector.value, false);
        }
        upcomingSelector.value = configureFilterUpcoming(dateSelector.value, periodSelector.value, upcomingSelector.value)
        updateData(type, periodSelector.value, dateSelector.value, upcomingSelector.value);
    });

    const form = document.createElement("form");
    form.id = "filter-form";
    form.append(periodSelector, dateSelector);

    // For expenses and earnings, a user might want to toggle view of upcoming occurances
    if (type != "budgets" && type != "charts") {
        const upcoming1 = document.createElement("option");
        upcoming1.textContent = "Hide Upcoming";
        upcoming1.value = "0";
        const upcoming2 = document.createElement("option");
        upcoming2.textContent = "Show Upcoming Only";
        upcoming2.value = "1";
        const upcoming3 = document.createElement("option");
        upcoming3.textContent = "Show All";
        upcoming3.value = "2";

        upcomingSelector.id = "upcoming-selector";
        upcomingSelector.title = "Select whether to show or hide upcoming occurances";
        upcomingSelector.value = "0";
        upcomingSelector.append(upcoming1, upcoming2, upcoming3);
        upcomingSelector.addEventListener("change", () => {
            updateData(type, periodSelector.value, dateSelector.value, upcomingSelector.value);
        })

        form.append(upcomingSelector);
    }
    
    return form;
}

function createViewingDates(startDate, endDate) {
    const dateContainer = document.createElement('div');
    dateContainer.classList.add('view-date-container');

    const start = document.createElement("p");
    start.textContent = getISOFormatDate(startDate);

    const middle = document.createElement("p");
    middle.textContent = "to";

    const end = document.createElement("p");
    end.textContent = getISOFormatDate(end);

    dateContainer.append(start, middle, end);
    return dateContainer;
}

function configureFilterDate(date, period, changePeriod=false) {
    // When the period is 'All Active', but the date was changed first, change the period to 'monthly' as a placeholder.
    if (changePeriod) {
        period = 3;
        document.getElementById('period-selector').value = 3;
    }

    // Creating UTC dates
    var tempDate = date;
    if (date != "") {
        if (!(date instanceof Date)) {
            var UTCDate = date.split('-');
            UTCDate[1] = UTCDate[1] - 1;
            tempDate = new Date(...UTCDate);
        }
    } else {
        return date;
    }
    
    if (period == 0) {
        return getISOFormatDate(tempDate);
    } else if (period == 1 || period == 2) { // Weekly
        tempDate = new Date(tempDate.setDate(tempDate.getDate() - tempDate.getDay()));
        return getISOFormatDate(tempDate);
    } else if (period == 3) { // Monthly
        tempDate = new Date(tempDate.getFullYear(), tempDate.getMonth(), 1);
        return getISOFormatDate(tempDate);
    } else if (period == 4) { // Yearly
        tempDate = new Date(tempDate.getFullYear(), 0, 1);
        return getISOFormatDate(tempDate);
    } else if (period == -1 || period == -2) {
        tempDate = new Date();
        return getISOFormatDate(tempDate);
    }
}

function configureFilterUpcoming(date, period, previous) {
    // Creating UTC date from the given start date
    var startDate = null;
    if (date != "") {
        var UTCDate = date.split('-');
        UTCDate[1] = UTCDate[1] - 1;
        startDate = new Date(...UTCDate);
    } else {
        return date;
    }

    var endDate = calculateEndDate(startDate, period);

    const todayDate = new Date();
    if (endDate < todayDate) { // The viewing period ends before today's date, so there are no upcoming things to show.
        return 0;
    } else if (startDate > todayDate) { // The viewing period starts after today's date, so there are no "past" items.
        return 2;
    } else { // If today's date is in the viewing period, the setting should stay on what the user had before.
        return previous;
    }
}

/** 
 * Parameters
 * ------------
 * startDate: Date Object
 * period: Int
*/
function calculateStartDate(includeDate, period) {
    var startDate = new Date(includeDate);
    
    if (period == 1 || period == 2) { // Weekly
        startDate = new Date(startDate.setDate(startDate.getDate() - startDate.getDay()));
    } else if (period == 3) { // Monthly
        startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    } else if (period == 4) { // Yearly
        startDate = new Date(startDate.getFullYear(), 0, 1);
    }

    return startDate;
}

function calculateEndDate(startDate, period) {
    var endDate = new Date(startDate);
    
    if (period == 1 || period == 2) { // Weekly
        endDate = new Date(endDate.setDate(endDate.getDate() + (6 - endDate.getDay())));
    } else if (period == 3) { // Monthly
        endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
    } else if (period == 4) {
        endDate = new Date(endDate.getFullYear(), 11, 31);
    }

    return endDate;
}

function getIndexOfRanges(date, ranges) {
    for (var i = 0; i < ranges.length; i++) {
        const tempRange = ranges[i];

        if (date >= tempRange.startDate && date <= tempRange.endDate) {
            return i;
        }
    }

    return -1;
}

function closeMenu() {
    const navbar = document.getElementsByTagName('nav')[0]
    const logo = document.getElementById('toggle-icon')

    if(logo.display != 'none') {
        if(logo.classList.contains('hamburg')) {
            // The menu is already closed
            return;
        }

        // The menu is 'close' (or the 'X' icon). Change to hamburg
        logo.src = "../static/images/hamburger-icon.svg";
        logo.classList.replace('close', 'hamburg');
        navbar.style.width = '0%'
    }
}

function toggleMenu() {
    const navbar = document.getElementsByTagName('nav')[0]
    const logo = document.getElementById('toggle-icon')

    if(logo.display != 'none') {
        if(logo.classList.contains('hamburg')) {
            // Change to 'x' icon
            logo.src = "../static/images/x-icon.svg";
            logo.classList.replace('hamburg', 'close');
            navbar.style.width = '70%';
        } else {
            // Change to 'hamburger' icon
            logo.src = "../static/images/hamburger-icon.svg";
            logo.classList.replace('close', 'hamburg');
            navbar.style.width = '0%';
        }
    }
}

function hidePlaceholders() {
    const placeholders = document.getElementsByClassName("placeholder");
    for (var i = 0; i < placeholders.length; i++) {
        placeholders[i].style.display = "none";
    }
}

/* Creates and enables a toggling eventlistener for the entire window when opening an options panel.
 * 
 * @param button (document object): The object being used as a toggling button.
 * @param optionsPanel (document object): The element (usually a div) to show or hide.
 * @param displayOption (String): The display method for the optionsPanel ('block', 'flex', or 'grid', etc.)
*/
function optionsToggle(button, optionsPanel, displayOption='block') {
    const panelHidden = optionsPanel.style.display == "none";
    const boundFunction = windowClick.bind(window, optionsPanel, button);

    if (panelHidden) {
        optionsPanel.style.display = displayOption;
        windowClickEnable(boundFunction);
    } else {
        optionsPanel.style.display = "none";
        windowClickDisable(boundFunction);
    }
}

function windowClickEnable(boundFunction) {
    window.addEventListener('click', boundFunction, true); 
}

function windowClickDisable(boundFunction) {
    window.removeEventListener('click', boundFunction, true);
}

function windowClick(optionsPanel, button) {
    const panelClick = this.event.target == optionsPanel; // Make sure the panel itself wasn't selected.
    const propagation = this.event.target == button; // Check to see if the window click event is the options button. 
    
    if (!panelClick) {
        if (!propagation) { // To avoid propagation issues, do not set to 'none' if it was the options' button click
            optionsPanel.style.display = "none";
        }
    }
}

async function fillProfilePics(image=null, color=null) {
    navConfig();
    window.addEventListener('resize', () => {
        navConfig();
    });

    var imageToUse = image;

    const pictures = document.getElementsByClassName('profile-icon');
    for (var pic of pictures) {
        if (imageToUse == null) {
            await fetch('/data/user').then(response => response.json()).then((responseData) => {
                imageToUse = responseData.data.profileImage;
                const colorToUse = responseData.data.profileColor;

                pic.src = "../static/images/profileImages/" + imageToUse + ".svg";
                pic.style.background = "radial-gradient(" + colorToUse + " 65%, transparent 90%)";

                // Check for profile labels
                const options = document.getElementsByClassName("label-profile-img");
                for (var element of options) {
                    element.children[0].style.background = "radial-gradient(" + colorToUse + " 65%, transparent 90%)";
                }
            });
        } else {
            pic.src = "../static/images/profileImages/" + imageToUse + ".svg"
            pic.style.background = "radial-gradient(" + color + " 65%, transparent 90%)";

            // Check for profile labels
            const options = document.getElementsByClassName("label-profile-img");
            for (var element of options) {
                element.children[0].style.background = "radial-gradient(" + color + " 65%, transparent 90%)";
            }
        }
    }
}

function navConfig() {
    const userIcon = document.getElementById('nav-profile-icon');
    const profileOptionsPanel = document.getElementById('profile-options');
    if (!userIcon) {
        return
    }
    
    if (window.innerWidth > 767) {
        userIcon.onclick = (event) => {
            optionsToggle(event.target, profileOptionsPanel, "grid");
        };
        profileOptionsPanel.style.display = "none";
    } else {
        userIcon.onclick = null;
        profileOptionsPanel.style.display = "contents";
    }
}

function back() {
    const referrer = document.referrer;

    if (referrer && referrer != "") {
        window.location.href = referrer;
    } else {
        window.history.back();
    }
}

function updateURLRefresh(url) {
    var tempArray = url.split("?");
    var baseURL = tempArray[0];
    var oldArgs = tempArray[1];
    var newArgs = "";

    if (oldArgs) {
        tempArray = oldArgs.split("&");
        for (var i = 0; i < tempArray.length; i++){
            const currentArg = tempArray[i].split('=')

            if (currentArg[0] == "refresh"){
                newArgs += currentArg[0] + "=True&";
            } else {
                newArgs += currentArg[0] + "=" + currentArg[1] + "&";
            }
        }
    }

    return baseURL + "?" + newArgs;
}

////////////////////////////////////////////////////////////////////
// Force reload when going back in window history to pushed state //
////////////////////////////////////////////////////////////////////
window.addEventListener("popstate", (e) => {
    location.reload();
});

//////////////////////////
// Cookie Consent Popup //
//////////////////////////
function showCookieConsent(show) {
    if (show && localStorage.getItem("popupWasShown") != "true") {
        const popupHeader = document.createElement("h3");
        popupHeader.id = "popup-header";
        popupHeader.textContent = "Cookie Consent";

        const popupText = document.createElement("p");
        popupText.id = "popup-text";
        popupText.innerText = "This website uses cookies to provide a personalized experience. Cookies are essential to the functionality of this website. When you click 'I Accept', you consent to our use of cookies.";

        const privacy = document.createElement("a");
        privacy.href = "/privacy#cookie-section";
        privacy.alt = "Link to cookie policy";
        privacy.textContent = "Cookie Policy";
        privacy.classList.add("normal-link");
        privacy.rel = "noopener noreferrer";
        privacy.target = "_blank";

        const acceptButton = document.createElement("button");
        acceptButton.textContent = "I Accept";

        const popup = document.createElement("div");
        popup.id = "popup";
        popup.classList.add("cookie-popup");
        popup.append(popupHeader, popupText, privacy, acceptButton);

        const popupWrapper = document.createElement("div");
        popupWrapper.id = "popup-wrapper";
        popupWrapper.append(popup);
        acceptButton.addEventListener("click", () => {
            // Set local storage to indicate that the popup has been shown
            localStorage.setItem("popupWasShown", "true");

            popupWrapper.remove();
        })

        document.getElementById("header-container").append(popupWrapper);
    }
}

//////////////////////
// Scroll Functions //
//////////////////////
var prevScrollpos = window.pageYOffset;
window.addEventListener('scroll', () => {
    const currentScrollPos = window.pageYOffset;

    // Hide/show nav bar when scrolling
    const logo = document.getElementById('toggle-icon');
    if(window.getComputedStyle(logo).getPropertyValue("display") != 'none') {
        if (prevScrollpos > currentScrollPos || currentScrollPos == 0) {
            if (document.getElementById('dashboard-left')) {
                document.getElementById("dashboard-left").style.transform = "translateY(0px)";
            }
            if (logo.classList.contains('hamburg')) {
                document.getElementsByTagName("header")[0].style.transform = "translateY(0px)";
            }
        } else {
            if (document.getElementById('dashboard-left')) {
                document.getElementById('dashboard-left').style.transform = "translateY(calc(-1.2 * var(--navPad)))";
            }
            if (logo.classList.contains('hamburg')) {
                document.getElementsByTagName("header")[0].style.transform = "translateY(-70px)";
            }
        }
        prevScrollpos = currentScrollPos;
    }
});

function sideScrollShadow(parent, child) {
    if (child.scrollWidth > parent.scrollWidth) { // There is overflow
        if (child.scrollLeft != 0 && (child.scrollLeft + parent.scrollWidth != child.scrollWidth)) {
            parent.classList.add("shadow-both");
            parent.classList.remove("shadow-right");
            parent.classList.remove("shadow-left");
        } else if (child.scrollLeft == 0) {
            parent.classList.add("shadow-right");
            parent.classList.remove("shadow-left");
            parent.classList.remove("shadow-both");
        } else if (child.scrollLeft + parent.scrollWidth == child.scrollWidth) {
            parent.classList.add("shadow-left");
            parent.classList.remove("shadow-right");
            parent.classList.remove("shadow-both");
        } else { // Is scrolled somewhere in the middle
            parent.classList.add("shadow-both");
            parent.classList.remove("shadow-right");
            parent.classList.remove("shadow-left");
        }
    } else {
        parent.classList.remove("shadow-right");
        parent.classList.remove("shadow-left");
        parent.classList.remove("shadow-both");
    }
}

function scrollToCookie() {
    document.getElementById("cookie-section").scrollIntoView();
}

function scrollToPrivacy() {
    document.getElementById("privacy-section").scrollIntoView();
}

////////////////////////////
// Functions for Carousel //
////////////////////////////

function carouselButtons(items, uniqueClass, containerId, maxShow=3, nextSlideGenerator) {
    var dotsToReturn = document.createElement("div");
    dotsToReturn.classList.add("carousel");

    const itemsLength = Object.keys(items).length
    const numSlides = Math.ceil(itemsLength / maxShow);

    for (var slideNum = 0; slideNum < numSlides; slideNum++) {
        const dot = document.createElement("div");
        dot.classList.add("carousel-dot", uniqueClass);
        const currentSlide = slideNum;
        dot.dataset.slideNum = currentSlide;
        dotsToReturn.append(dot);
    }

    // Add click event listener
    var transitionRunning = false;
    dotsToReturn.addEventListener("click", (e) => {
        if (transitionRunning == false) {
            transitionRunning = true;

            if (e.target.classList.contains('carousel-dot')) {
                const slide = e.target.dataset.slideNum;
                dotClick(slide, uniqueClass, containerId, () => {return nextSlideGenerator(items, slide, maxShow)})
            } 

            setTimeout(() => {
                transitionRunning = false;
            }, 1000);

        }
    })

    return dotsToReturn;
}

function dotClick(slideNum, uniqueClass, containerId, newChildFunc) {
    // First, change which dot is active and get the current and new dot indeces
    const previousIndex = changeActiveDot(slideNum, uniqueClass);

    if (slideNum == previousIndex) {
        return
    }

    // Update the content and create a transition depending on which dot is before the other
    const itemContainer = document.getElementById(containerId);
    const firstChild = itemContainer.firstChild;
    const newChild = newChildFunc();
    itemContainer.append(newChild);

    if (slideNum < previousIndex) { // Slide right
        firstChild.addEventListener("animationend", (e) => {
            e.target.remove();
        });  
        newChild.style.animation = "slideInLeft 700ms ease-in-out";
        firstChild.style.animation = "slideOutRight 700ms ease-in-out";
 
    } else { // Slide left
        firstChild.addEventListener("animationend", (e) => {
            e.target.remove();
        });  
        newChild.style.animation = "slideInRight 700ms ease-in-out";
        firstChild.style.animation = "slideOutLeft 700ms ease-in-out";
    }
}

function changeActiveDot(slideNum, uniqueClass) {
    const buttons = document.getElementsByClassName(uniqueClass);
    const buttonsLength = Object.keys(buttons).length

    var previousSlide;
    for (var index = 0; index < buttonsLength; index++) {
        const dot = buttons[index];
        if (dot.classList.contains("active-dot")) {// This is the previously selected dot
            if (index == slideNum) { // This means the active dot was clicked again
                return index;
            } else {
                previousSlide = index;
                dot.classList.add("inactive-dot");
                dot.classList.remove("active-dot");
            }
        } else if (index == slideNum) {
            dot.classList.add("active-dot");
            dot.classList.remove("inactive-dot");
        } else {
            dot.classList.add("inactive-dot");
            dot.classList.remove("active-dot");
        }
    }

    return previousSlide;
}

/////////////////////////////////
// Functions for Generating UI //
/////////////////////////////////
/* Creates and displays UI for the user information panal
 * 
 * @param username (string): User's username
 * @param img (string): link to user's profile image
 */
function generateProfileUI(username, email, color, img, currency) {
    const user_img = document.createElement('img');
    user_img.src = "../static/images/profileImages/" + img + ".svg";
    user_img.id = "user-thumbnail";
    user_img.alt = "User's profile image."
    user_img.classList.add('profile-icon');
    user_img.style.background = "radial-gradient(" + color + " 65%, transparent 90%)";

    const user_name = document.createElement('p');
    user_name.id = "user-name";
    user_name.textContent = username;

    const email_label = document.createElement('p');
    email_label.textContent = "Email";
    email_label.classList.add('label');
    const user_email = document.createElement('p');
    user_email.textContent = String(email);
    const email_container = document.createElement('div');
    email_container.id = "user-email";
    email_container.append(email_label, user_email);

    const currency_label = document.createElement('p');
    currency_label.textContent = "Currency";
    currency_label.classList.add('label');
    const user_currency = document.createElement('p');
    user_currency.textContent = String(currency);
    const currency_container = document.createElement('div');
    currency_container.id = "user-currency";
    currency_container.append(currency_label, user_currency);

    const edit_button = document.createElement('img');
    edit_button.src = "../static/images/EditButtonSM.svg";
    edit_button.classList.add('edit-img');
    edit_button.alt = "Edit Button"
    edit_button.addEventListener('click', function() {
        window.location.href = "/form/update-user";
    })

    const profileContainer = document.createElement('div');
    profileContainer.id = "user-info-container";
    profileContainer.append(user_img, user_name, email_container, currency_container, edit_button);

    return profileContainer;
}

function generateCurveProgress(fillAmount, greyAmount, totalAmount, width='200', height='120') {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewbox', '0 0 ' + String(width) + ' ' + String(height));
    svg.classList.add('progress-svg');
    svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");

    const path1 = document.createElementNS("http://www.w3.org/2000/svg", 'path');
    path1.setAttribute('d', 'M15,100 a60,60 0 0,1 170,0');
    path1.classList.add('outer-progress');
    path1.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
    svg.append(path1);

    if (greyAmount != 0) {
        const path2 = document.createElementNS("http://www.w3.org/2000/svg", 'path');
        path2.setAttribute('d', 'M15,100 a60,60 0 0,1 170,0');
        const path2Length = path2.getTotalLength();
        path2.setAttribute('stroke-dasharray', (greyAmount/totalAmount) * path2Length + ' ' + path2Length);
        path2.classList.add('grey-progress');
        path2.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
        
        svg.append(path2);
    }

    if (fillAmount != 0) {
        const path3 = document.createElementNS("http://www.w3.org/2000/svg", 'path');
        path3.setAttribute('d', 'M15,100 a60,60 0 0,1 170,0');
        const path2Length = path3.getTotalLength();
        path3.setAttribute('stroke-dasharray', (fillAmount/totalAmount) * path2Length + ' ' + path2Length);
        path3.classList.add('inner-progress');
        path3.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
        
        svg.append(path3);
    }

    return svg;
}

/* Creates and displays UI for all budget information
 * 
 * @param budgets (list): A list of IDs that each correspond to a budget
 *      stored in the database.
 * @param currency (string): A single character representing the user's currency symbol
 */
function generateBudgetsUI(budgets, currency, viewingDate=new Date(), inactive=false) {
    const budgetContainer = document.createElement('div');
    budgetContainer.id = 'budget-container';

    if (Object.keys(budgets).length == 0) {
        const emptyText = document.createElement("p");
        emptyText.textContent = "Empty";
        emptyText.id = "empty-budgets";

        const emptyDiv = document.createElement("div");
        emptyDiv.id = "empty-budgets-div";
        emptyDiv.append(emptyText);

        return emptyDiv;
    }
    
    for (const key in budgets) {
        // Meta data
        const formatDateString = getISOFormatDate(viewingDate);

        const budgetPanel = document.createElement('div');
        budgetPanel.classList.add('budget-info');
        budgetPanel.addEventListener('click', function(e) {
            if (!e.target.classList.contains('options')) {
                window.location = "/expand-budget?id=" + key + "&date=" + formatDateString + "&period=" + budgets[key].budgetPeriod + "&inactive=" + inactive;
            }
        })

        const optionsImg = document.createElement('img');
        optionsImg.src = "static/images/Options-icon.svg";
        optionsImg.classList.add('options-img', 'options');
        optionsImg.title = "Options";

        const recur_div = document.createElement("div");
        if (budgets[key].recurring) {
            const period = PERIODS[budgets[key].budgetPeriod];
            recur_div.title = "This budget recurs " + period.toLocaleLowerCase() + ".";

            const recur_img = document.createElement('img');
            recur_img.src = 'static/images/recurIcon.svg';
            recur_img.classList.add('recur-img');
            recur_img.alt = "recur icon";
            
            const recur_flag = document.createElement('img');
            recur_flag.src = 'static/images/recur-label.svg';
            recur_flag.classList.add('recur-flag');
            recur_flag.alt = "flag for recur icon";

            const recur_text = document.createElement('p');
            recur_text.classList.add('recur-text');
            recur_text.textContent = "  " + period;

            recur_div.append(recur_img, recur_flag, recur_text);
            recur_div.id = "recur-icon-div";
        }
                
        const budget_name = document.createElement('h2');
        budget_name.classList.add('budget-name');
        budget_name.textContent = budgets[key].name;

        const budget_used = document.createElement('p');
        budget_used.classList.add('fraction-top');
        budget_used.textContent = currency + formatNumber(budgets[key].totalUsedAmount);

        const budget_slash = document.createElement('h2');
        budget_slash.classList.add('fraction-slash');
        budget_slash.textContent = "／"

        const budget_amount = document.createElement('p');
        budget_amount.classList.add('fraction-bottom');
        budget_amount.textContent = currency + formatNumber(budgets[key].amount);

        const amount_div = document.createElement("div");
        amount_div.classList.add("fraction-container");
        amount_div.append(budget_used, budget_slash, budget_amount);

        // Progess SVG
        const svgDiv = document.createElement('div');
        svgDiv.classList.add('svg-div');

        const svg = generateCurveProgress(budgets[key].usedAmount, budgets[key].totalUsedAmount, budgets[key].amount);

        svgDiv.append(svg);

        // End progress svg
        // Create Popup options for budget info
        const budget_update_img = document.createElement('img');
        budget_update_img.src = "static/images/EditButtonSM.svg";
        budget_update_img.classList.add('update-img', 'options');
        
        const budget_update_text = document.createElement('h4');
        budget_update_text.textContent = "Edit";
        budget_update_text.classList.add('options');
        const budget_update = document.createElement('div');
        budget_update.classList.add('budget-edit', 'options');
        budget_update.addEventListener('click', function() {
            window.location = "/form/update-budget?id=" + key + "&duplicate=False&date=" + formatDateString + "&inactive=" + inactive;
        })
        budget_update.append(budget_update_img, budget_update_text);

        const budget_copy_img = document.createElement('img');
        budget_copy_img.src = "static/images/DuplicateIcon.svg";
        budget_copy_img.classList.add('copy-img', 'options');
        
        const budget_copy_text = document.createElement('h4');
        budget_copy_text.textContent = "Duplicate";
        budget_copy_text.classList.add('options');
        const budget_copy = document.createElement('div');
        budget_copy.classList.add('budget-copy', 'options');
        budget_copy.addEventListener('click', function() {
            window.location = "/form/update-budget?id=" + key + "&duplicate=True&inactive=" + inactive;
        })
        budget_copy.append(budget_copy_img, budget_copy_text);

        const budget_more_img = document.createElement('img');
        budget_more_img.src = "static/images/MoreButtonsmall.svg";
        budget_more_img.classList.add('more-img');        
        
        const budget_more_text = document.createElement('h4');
        budget_more_text.textContent = "See Details";
        const budget_more = document.createElement('div');
        budget_more.classList.add('budget-more', 'options');
        budget_more.addEventListener('click', function() {
            window.location = "/expand-budget?id=" + key + "&date=" + formatDateString + "&period=" + budgets[key].budgetPeriod + "&inactive=" + inactive;
        })
        budget_more.append(budget_more_img, budget_more_text)

        const optionsPanelTitle = document.createElement("p");
        optionsPanelTitle.classList.add("options-title");
        optionsPanelTitle.textContent = budgets[key].name;

        const optionsPanel = document.createElement('div');
        optionsPanel.classList.add('options-panel', 'options');
        optionsPanel.style.display = "none";
        optionsPanel.append(optionsPanelTitle, budget_update, budget_copy, budget_more);
        optionsImg.addEventListener('click', (event) => {
            optionsToggle(event.target, optionsPanel);
        }, false);
        const budget_options = document.createElement('div');
        budget_options.classList.add('options-div', 'options');
        budget_options.append(optionsImg, optionsPanel);

        budgetPanel.append(budget_options, recur_div, budget_name, svgDiv, amount_div);
        budgetContainer.append(budgetPanel);
    }

    return budgetContainer;
}

/* Creates and displays UI for all expense or earning information
 * Going with a table layout for the data.
 * 
 * @param type (int): Type of entity to be formated as a list
 *      - 0 : Expense
 *      - 1 : Earning
 * @param entityList (List): List of a user's expenses or earnings
 * @param currency (string): A single character representing the user's currency symbol
 * @param dateType (int): Type of date to include from an expense or earning: passed dates or upcomming dates
 *      - 0 : Passed (Date in the past or the current day)
 *      - 1 : Upcoming (Dates starting the day after the current day and has not happened yet)
 *      - 2 : Both Passed and upcoming
 * @param limit (int): Number of rows to include in the final table
 */
function generateTableUI(type, entityList, currency, dateType, limit=null) {
    const TYPES = ['expense', 'earning'];
    var categories;
        
    // Configure some values based on table type
    var columns;
    if (type == 0) {
        columns = ['Name', 'Amount', 'Category', 'Date', 'Recurring?', 'Actions']

        categories = entityList.categories;
        entityList = entityList.expenses;
    } else {
        columns = ['Name', 'Amount', 'Date', 'Recurring?', 'Actions'];
    }

    // Create table head row with column titles
    const headRow = document.createElement('tr');
    columns.forEach(title => {
        const col = document.createElement('th');
        col.textContent = title;
        headRow.append(col);
    })
    const tableHead = document.createElement('thead');
    tableHead.append(headRow);

    const table = document.createElement('table');
    table.append(tableHead);

    const unsortedRows = document.createElement('div');
    var ascendingOrder = false;
    for (const key in entityList) {
        var dates;
        if (dateType == 0) {
            dates = entityList[key].passedDates;
        } else if (dateType == 1) {
            dates = entityList[key].upcomingDates;
            ascendingOrder = true;
        } else {
            dates = (entityList[key].passedDates).concat(entityList[key].upcomingDates);
        }
        
        dates.forEach(rawDate => {
            const current = entityList[key].data;

            const name = document.createElement('td');
            name.textContent = current.name;
            name.classList.add('td-name');

            const amount = document.createElement('td');
            amount.textContent = currency + formatNumber(current.amount);
            amount.classList.add('td-amount');

            var expense_category;
            if (type == 0) {
                expense_category = document.createElement('td');
                expense_category.classList.add('td-category');

                const category_text = document.createElement("p");
                category_text.textContent = current.budgetCategory;
                expense_category.append(category_text);

                if (!categories.includes(current.budgetCategory)) {
                    const warning = createWarningIcon("This budget may not exist anymore. Further action needed.");
                    expense_category.append(warning);
                    expense_category.style.display = "flex";
                    expense_category.classList.add('flex-td')
                }
            } 

            const recur = document.createElement('td');
            recur.classList.add('td-recur');
            if (current.recurring) {
                const recur_img = document.createElement('img');
                recur_img.classList.add('recur-img');
                recur_img.src = "static/images/recurIcon.svg";
                const period = PERIODS[current.recurPeriod].toLocaleLowerCase();
                recur_img.title = "This " + TYPES[type] + " recurs " + period;
                recur.append(recur_img);
            } else {
                const recur_img = document.createElement('img');
                recur_img.classList.add('non-recur-img');
                recur_img.src = "static/images/grey-x.svg";
                recur_img.title = "This " + TYPES[type] + " does not recur";
                recur.append(recur_img);
            }

            const date = document.createElement('td');
            const localDate = new Date(rawDate);
            const formatDate = new Date(localDate.getUTCFullYear(), localDate.getUTCMonth(), localDate.getUTCDate());
            const formatDateString = formatDate.toLocaleDateString('en-us', getDateFormattingOptions());
            date.dataset.startDate = formatDate;
            date.classList.add('start-date');
            date.textContent = formatDateString;

            const copy_img = document.createElement('img');
            copy_img.src = "static/images/DuplicateIcon.svg";
            copy_img.classList.add("copy-img");
            copy_img.title = "Duplicate";
            copy_img.addEventListener('click', function() {
                window.location = "/form/update-" + TYPES[type] + "?id=" + key + "&duplicate=True";
            })

            const update_img = document.createElement('img');
            update_img.src = "static/images/EditButtonSM.svg";
            update_img.classList.add("update-img");
            update_img.title = "Update";
            update_img.addEventListener('click', function() {
                window.location = "/form/update-" + TYPES[type] + "?id=" + key + "&duplicate=False&date=" + getISOFormatDate(formatDate);
            })

            const actionDiv = document.createElement('div');
            actionDiv.classList.add('action-div');
            actionDiv.append(copy_img, update_img);

            const actions = document.createElement('td');
            actions.classList.add('td-update');
            actions.append(actionDiv);

            const row1 = document.createElement('tr');
            row1.classList.add('main-row');
            if (type == 0) {
                row1.append(name, amount, expense_category, date, recur, actions);
            } else {
                row1.append(name, amount, date, recur, actions);
            }

            // Expand row
            const desLabel = document.createElement("h4");
            desLabel.textContent = "Description";
            const desText = document.createElement("p");
            desText.textContent = String(current.description) || "None";
            const description = document.createElement('div');
            description.append(desLabel, desText);

            const expanseDiv = document.createElement('div'); // Div to contain all the expanse info
            expanseDiv.classList.add("expanse-div");          // Check to see if we need to make recur sections.
            expanseDiv.append(description);

            if (current.recurring) {
                const recLabel = document.createElement("h4");
                recLabel.textContent = "Recurring Period"
                const recText = document.createElement("p");
                recText.textContent = PERIODS[current.recurPeriod];
                const recurPeriod = document.createElement('div');
                recurPeriod.append(recLabel, recText);

                const recStartLabel = document.createElement("h4");
                recStartLabel.textContent = "Recurrance Start Date";
                const recStart = document.createElement("p");
                if (current.startDate) {
                    const formatDate =  new Date(current.startDate);
                    recStart.textContent = formatDate.toLocaleDateString('en-us', getDateFormattingOptions());
                } else {
                    recStart.textContent = "None";
                }
                const recurStartDate = document.createElement('div');
                recurStartDate.append(recStartLabel, recStart);

                const recEndLabel = document.createElement("h4");
                recEndLabel.textContent = "Recurrance End Date";
                const recEnd = document.createElement("p");
                if (current.endDate) {
                    const formatDate =  new Date(current.endDate);
                    recEnd.textContent = formatDate.toLocaleDateString('en-us', getDateFormattingOptions());
                } else {
                    recEnd.textContent = "None";
                }
                const recurEndDate = document.createElement('div');
                recurEndDate.append(recEndLabel, recEnd);

                // Add recur sections to the expanse div
                expanseDiv.append(recurPeriod, recurStartDate, recurEndDate);
            }

            const expanseTD = document.createElement('td');
            expanseTD.colSpan = headRow.cells.length;
            expanseTD.append(expanseDiv);

            const row2 = document.createElement('tr');
            row2.classList.add('expanse-row');
            row2.style.display = "none";
            row2.append(expanseTD);

            row1.addEventListener("click", () => {
                toggleExpanse(row2);
            });
            row2.addEventListener("click", () => {
                toggleExpanse(row2);
            });
            const tableRow = document.createElement('tbody');
            tableRow.append(row1, row2);

            unsortedRows.append(tableRow);
        }) 
    }

    if (unsortedRows.children.length > 0) {
        if (limit) {
            const sortedElements = sortByStartDate(Array.prototype.slice.call(unsortedRows.children), ascendingOrder);
            const sortedLength = sortedElements.length;
            for (var index = 0; index < limit && index < sortedLength; index++) {
                table.append(sortedElements[index])
            }
        } else {
            table.append(...sortByStartDate(Array.prototype.slice.call(unsortedRows.children), ascendingOrder));
        }
    } else {
        const emptybody = document.createElement('tbody');
        const emptyRow = document.createElement('tr');
        const emptyCol = document.createElement('td');
        emptyCol.classList.add("empty-body");
        emptyCol.textContent = "Empty";
        emptyCol.colSpan = headRow.cells.length;

        emptyRow.append(emptyCol);
        emptybody.append(emptyRow);

        table.classList.add('empty-table');
        table.append(emptybody);
    }

    return table;
}

function createWarningIcon(message) {
    const warning = document.createElement("img");
    warning.src = "../static/images/WarningIcon.svg";
    warning.classList.add('warning-icon');
    warning.title = message;
    warning.alt = "Warning message icon";

    return warning;
}

/* 
 * Shows or hides the expanded info in a table
 */
function toggleExpanse(expanse) {
    const rows = document.getElementsByClassName('expanse-row');

    for (const row of rows) {
        if (row == expanse) {
            if (row.style.display == "none") {
                expanse.style.display = "table-row";
            } else {
                row.style.display = "none";
            }
        } else {
            row.style.display = "none";
        }
    }
}

/* Reorders html elements based on the start date attribute
 * 
 * @param container (HTMl Parent): Parent class containing the items to be sorted
 */
function sortByStartDate(elements, ascending=false) {
    var length = elements.length;

    for (let i = 0; i < length; i++) {
        var current = elements[i];
        var j = i - 1;

        if (j < 0) {
            continue;
        }

        var curDate = new Date(elements[i].querySelector('.start-date').dataset.startDate).getTime();
        var prevDate = new Date(elements[j].querySelector('.start-date').dataset.startDate).getTime();

        if (ascending) {
            while (prevDate > curDate) {
                elements[j + 1] = elements[j] // Move previous item to the current item's position
                j = j - 1;
                if (j < 0) {
                    break
                } else {
                    var prevDate = new Date(elements[j].querySelector('.start-date').dataset.startDate).getTime();
                }
            }
        } else {
            while (prevDate < curDate) {
                elements[j + 1] = elements[j] // Move previous item to the current item's position
                j = j - 1;
                if (j < 0) {
                    break
                } else {
                    var prevDate = new Date(elements[j].querySelector('.start-date').dataset.startDate).getTime();
                }
            }
        }

        elements[j + 1] = current;
    }

    return elements;
}