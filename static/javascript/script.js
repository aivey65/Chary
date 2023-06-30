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

function dashboardAction() {
    window.location = '/dashboard';
    closeMenu()
}

function formatNumber(number) {
    const numberFormatter = Intl.NumberFormat("en", { notation: "compact" });
    return numberFormatter.format(number);
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
        placeholders[i].style.display = "None";
    }
}

/* Creates and enables a toggling eventlistener for the entire window when opening the an options panel.
 * 
 * @param button (document object): The object being used as a toggling button.
 * @param optionsPanel (document object): The element (usually a div) to show or hide.
 * @param displayOption (String): The display method for the optionsPanel ('block', 'flex', or 'grid', etc.)
*/
function optionsToggle(button, optionsPanel, displayOption='block') {
    const panelHidden = optionsPanel.style.display == "none";
    boundFunction = windowClick.bind(window, optionsPanel, button);

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

        windowClickDisable(boundFunction);
    }
}

function fillProfilePics(imageToUse=null) {
    const userIcon = document.getElementById('nav-profile-icon');
    const profileOptionsPanel = document.getElementById('profile-options');

    if (userIcon) {
        userIcon.addEventListener('click', (event) => {
            optionsToggle(event.target, profileOptionsPanel, "grid");
        }, false);
    }

    const pictures = document.getElementsByClassName('profile-icon');
    for (pic of pictures) {
        if (imageToUse == null) {
            fetch('/data/user').then(response => response.json()).then((responseData) => {
                    imageToUse = responseData.data.profileImage;
                    pic.src = "../static/images/profileImages/" + imageToUse + ".svg"
                    
                });
            } else {
                pic.src = "../static/images/profileImages/" + imageToUse + ".svg"
            }
    }
}

function back() {
    window.history.back();
}

//////////////////////
// Scroll Functions //
//////////////////////
var prevScrollpos = window.pageYOffset;
window.addEventListener('scroll', () => {
    const currentScrollPos = window.pageYOffset;

    // Hide/show nav bar when scrolling
    const logo = document.getElementById('toggle-icon')
    if(logo.display != 'none' && logo.classList.contains('hamburg')) {
        if (prevScrollpos > currentScrollPos) {
            document.getElementsByTagName("header")[0].style.transform = "translateY(0px)";
        } else {
            document.getElementsByTagName("header")[0].style.transform = "translateY(-70px)";
        }
        prevScrollpos = currentScrollPos;
    }
});

/////////////////////////////////
// Functions for Generating UI //
/////////////////////////////////

/* Creates and displays UI for the user information panal
 * 
 * @param balance (int): Number value for user's balance
 * @param username (string): User's username
 * @param img (string): link to user's profile image
 */
function generateProfileUI(balance, username, email, color, img, currency) {
    const user_img = document.createElement('img');
    user_img.src = "../static/images/profileImages/" + img + ".svg";
    user_img.id = "user-thumbnail";
    user_img.alt = "User's profile image."
    user_img.classList.add('profile-icon');

    const user_name = document.createElement('p');
    user_name.id = "user-name";
    user_name.textContent = username;

    const user_email = document.createElement('p');
    user_email.id = "user-email";
    user_email.textContent = "Email: " + String(email);

    const wallet_icon = document.createElement('img');
    wallet_icon.src = "../static/images/WalletIcon.svg";
    wallet_icon.id = "wallet-icon";
    wallet_icon.alt = "Icon of a wallet."
    wallet_icon.title = "Current Projected Balance"
    wallet_icon.classList.add('wallet-img');

    const user_balance = document.createElement('p');
    user_balance.id = "user-balance";
    user_balance.title = "Current Projected Balance"
    user_balance.textContent = String(currency) + String(balance);

    const user_currency = document.createElement('p');
    user_currency.id = "user-currency";
    user_currency.textContent = "Currency: " + String(currency);

    const profileContainer = document.createElement('div');
    profileContainer.id = "user-info-container";
    profileContainer.append(user_img, wallet_icon, user_balance, user_name, user_email, user_currency);

    return profileContainer;
}

function generateCurveProgress(fillAmount, totalAmount, width='200', height='120') {
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

    if (fillAmount != 0) {
        const path2 = document.createElementNS("http://www.w3.org/2000/svg", 'path');
        path2.setAttribute('d', 'M15,100 a60,60 0 0,1 170,0');
        path2Length = path2.getTotalLength();
        path2.setAttribute('stroke-dasharray', (fillAmount/totalAmount) * path2Length + ' ' + path2Length);
        path2.classList.add('inner-progress');
        path2.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
        
        svg.append(path2);
    }

    return svg;
}

/* Creates and displays UI for all budget information
 * 
 * @param budgets (list): A list of IDs that each correspond to a budget
 *      stored in the database.
 * @param currency (string): A single character representing the user's currency symbol
 */
function generateBudgetsUI(budgets, currency) {
    budgetContainer = document.createElement('div');
    budgetContainer.id = 'budget-container';
    
    for (const key in budgets) {
        const budgetPanel = document.createElement('div');
        budgetPanel.classList.add('budget-info');
        budgetPanel.addEventListener('click', function(e) {
            if (!e.target.classList.contains('options')) {
                window.location = "/expand-budget?id=" + key;
            }
        })

        const optionsImg = document.createElement('img');
        optionsImg.src = "static/images/Options-icon.svg";
        optionsImg.classList.add('options-img', 'options');
        optionsImg.title = "Options";

        var recur_img;
        if (budgets[key].recurring) {
            recur_img = document.createElement('img');
            recur_img.src = 'static/images/recurIcon.svg';
            recur_img.classList.add('recur-img');
            const period = PERIODS[budgets[key].budgetPeriod].toLocaleLowerCase();
            recur_img.title = "This budget recurs " + period + ".";
        }
        
        const budget_name = document.createElement('h2');
        budget_name.classList.add('budget-name');
        budget_name.textContent = budgets[key].name;

        const budget_used = document.createElement('p');
        budget_used.classList.add('fraction-top');
        budget_used.textContent = currency + formatNumber(budgets[key].usedAmount);

        const budget_slash = document.createElement('h2');
        budget_slash.classList.add('fraction-slash');
        budget_slash.textContent = "／"

        const budget_amount = document.createElement('p');
        budget_amount.classList.add('fraction-bottom');
        budget_amount.textContent = currency + formatNumber(budgets[key].amount);

        // Progess SVG
        const svgDiv = document.createElement('div');
        svgDiv.classList.add('svg-div');

        const svg = generateCurveProgress(budgets[key].usedAmount, budgets[key].amount);

        svgDiv.append(svg);

        // End progress svg
        // Create Popup options for budget info
        const budget_update_img = document.createElement('img');
        budget_update_img.src = "static/images/EditButtonSM.svg";
        budget_update_img.classList.add('update-img');
        
        const budget_update_text = document.createElement('h4');
        budget_update_text.textContent = "Edit";
        const budget_update = document.createElement('div');
        budget_update.classList.add('budget-edit', 'options');
        budget_update.addEventListener('click', function() {
            window.location = "/form/update-budget?id=" + key;
        })
        budget_update.append(budget_update_img, budget_update_text);

        const budget_more_img = document.createElement('img');
        budget_more_img.src = "static/images/MoreButtonsmall.svg";
        budget_more_img.classList.add('more-img');        
        
        const budget_more_text = document.createElement('h4');
        budget_more_text.textContent = "See More";
        const budget_more = document.createElement('div');
        budget_more.classList.add('budget-more', 'options');
        budget_more.addEventListener('click', function() {
            window.location = "/expand-budget?id=" + key;
        })
        budget_more.append(budget_more_img, budget_more_text)

        const optionsPanel = document.createElement('div');
        optionsPanel.classList.add('options-panel', 'options');
        optionsPanel.style.display = "none";
        optionsPanel.append(budget_update, budget_more);
        optionsImg.addEventListener('click', (event) => {
            optionsToggle(event.target, optionsPanel);
        }, false);
        const budget_options = document.createElement('div');
        budget_options.classList.add('options-div', 'options');
        budget_options.append(optionsImg, optionsPanel);

        budgetPanel.append(budget_options, recur_img, budget_name, svgDiv, budget_used, budget_slash, budget_amount);
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
 */
function generateTableUI(type, entityList, currency) {
    const TYPES = ['expense', 'earning'];
        
    // Configure some values based on table type
    var columns;
    if (type == 0) {
        columns = ['Name', 'Expense Amount', 'Budget Category', 'Description', 'Date', 'Recurring?', 'Edit']
    } else {
        columns = ['Name', 'Earning Amount', 'Description', 'Date', 'Recurring?', 'Edit'];
    }

    // Create table head row with column titles
    headRow = document.createElement('tr');
    columns.forEach(title => {
        col = document.createElement('th');
        col.textContent = title;
        headRow.append(col);
    })
    const tableHead = document.createElement('thead');
    tableHead.append(headRow);

    const tableBody = document.createElement('tbody');
    for (const key in entityList) {
        const current = entityList[key].data;

        const name = document.createElement('td');
        name.textContent = current.name;

        const amount = document.createElement('td');
        amount.textContent = currency + formatNumber(current.amount);

        var expense_category;
        if (type == 0) {
            expense_category = document.createElement('td');
            expense_category.textContent = current.budgetCategory;
        } 

        const description = document.createElement('td');
        description.textContent = current.description;
        description.classList.add('long-text');

        recur = document.createElement('td');
        if (current.recurring) {
            const recur_img = document.createElement('img');
            recur_img.classList.add('recur-img');
            recur_img.src = "static/images/recurIcon.svg";
            recur_img.title = "This " + TYPES[type] + " is recurring over a specified period of time";
            recur.append(recur_img);
        }

        const update = document.createElement('td');
        const update_img = document.createElement('img');
        update_img.src = "static/images/EditButtonSM.svg"
        update_img.classList.add("update-img");
        update_img.title = "Update";
        update_img.addEventListener('click', function() {
            window.location = "/form/update-" + type + "?id=" + key;
        })
        update.append(update_img);

        dates = entityList[key].dates;
        dates.forEach(rawDate => {
            const date = document.createElement('td');
            const formatDate =  new Date(rawDate);
            date.textContent = formatDate.toLocaleDateString();

            const entityRow = document.createElement('tr');
            entityRow.classList.add('table-row');
            if (type == 0) {
                entityRow.append(name.cloneNode(true), amount.cloneNode(true), expense_category.cloneNode(true), description.cloneNode(true), date, recur.cloneNode(true), update.cloneNode(true));
            } else {
                entityRow.append(name.cloneNode(true), amount.cloneNode(true), description.cloneNode(true), date, recur.cloneNode(true), update.cloneNode(true));
            }
            tableBody.append(entityRow)
        }) 
    }

    table = document.createElement('table');
    table.append(tableHead, tableBody);
    return table;
}