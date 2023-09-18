import imp
import os
from dotenv import load_dotenv
import pathlib
import requests
from flask import Flask, session, abort, redirect, request, render_template
from google.oauth2 import id_token
from google_auth_oauthlib.flow import Flow
import bcrypt
import hmac
import hashlib
from base64 import b64encode
from pip._vendor import cachecontrol
import google.auth.transport.requests
from functools import wraps

import database

app = Flask(__name__, template_folder="templates")
app.config['TEMPLATES_AUTO_RELOAD'] = True
# Load environment variables and set secret key
load_dotenv()

app.secret_key = os.getenv("SECRET_KEY")
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")

# Get the path to the client secret JSON file generated 
# using Google Cloud Platform
secret_file = os.path.join(pathlib.Path(__file__).parent.parent, "client_secret.json")

flow = Flow.from_client_secrets_file(
    client_secrets_file=secret_file,
    scopes=["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email", "openid"],
    redirect_uri="http://127.0.0.1:5000/google/auth"  
)

###################################
# Non-protected pages that can be #
# viewed by any user              #
###################################

@app.route("/")
def renderHome():
    return render_template('landing.html', loggedIn=isLoggedIn(), nav=renderedNav())

@app.route("/about")
def renderAbout():
    return render_template('about.html', loggedIn=isLoggedIn(), nav=renderedNav())

@app.route("/login")
def renderLogin():
    return render_template('login.html', loggedIn=isLoggedIn(), nav=renderedNav())

@app.route("/signup")
def renderSignup():
    return render_template('signup.html', loggedIn=isLoggedIn(), nav=renderedNav())

@app.route("/privacy")
def renderPrivacyPolicy():
    return render_template('privacy-policy.html', loggedIn=isLoggedIn(), nav=renderedNav())

####################################
# Functions for logging in and out #
####################################

def login_is_required(function):
    @wraps(function)
    def wrapper(*args, **kwargs):
        if ("google_id" not in session) and ("chary_id" not in session):
            return abort(401)
        else:
            return function()

    return wrapper

def isLoggedIn():
    if ("google_id" not in session) and ("chary_id" not in session):
        return False
    else:
        return True
    
def renderedNav():
    if isLoggedIn():
        return """
            <ul>
                <li><a href='/'>Home</a></li>
                <li><a href='/about'>About</a></li>
                <li class='nav-nolink'>|</li>
                <li><a href='/dashboard'>Dashboard</a></li>
                <div>
                    <img id='nav-profile-icon' class='profile-icon' src='../static/images/profileImages/undraw_blank.svg' alt='Profile image button that opens profile options'/>
                    <div id='profile-options' style='display: none;'>
                        <a href='/profile'>Profile</a>
                        <a href='/logout'>Log Out</a>
                    </div>
                </div>
            </ul>
        """
    else:
        return """
            <ul>
                <li><a href='/'>Home</a></li>
                <li><a href='/about'>About</a></li>
                <li><a href='/login'>Sign In</a></li>
                <li><a href="/signup">Sign Up</a></li>
            </ul>
        """

@login_is_required
@app.route("/google")
def googleLogin():
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true'
    )
    session["state"] = state
    return redirect(authorization_url)

@login_is_required
@app.route("/logout")
def logout():
    session.clear()
    return redirect("/")

@app.route("/google/auth")
def google_auth(): 
    flow.fetch_token(authorization_response=request.url)

    if not session["state"] == request.args["state"]:
        abort(500)

    credentials = flow.credentials
    request_session = requests.session()
    cached_session = cachecontrol.CacheControl(request_session)
    token_request = google.auth.transport.requests.Request(session=cached_session)

    id_info = id_token.verify_oauth2_token(
        id_token=credentials._id_token,
        request=token_request,
        audience=CLIENT_ID,
        clock_skew_in_seconds=5
    )

    if (id_info.get("email_verified") == True):
        session["google_id"] = id_info.get("sub")
        session["name"] = id_info.get("name")
        session["email"] = id_info.get("email")
        session["credentials"] = {
            'token': credentials.token,
            'refresh_token': credentials.refresh_token
        }
        return redirect("/dashboard")
    else:
        abort(403)

@app.route("/chary/auth/validate", methods=['POST'])
def chary_auth(): 
    try:
        givenEmail = request.json["email"]
        givenPassword = request.json["password"]

        potentialUser = database.getUser(givenEmail).get('data')

        if (potentialUser == None):
            return {
                "status": 400,
                "message": "We could not find an account with that email. Try signing up for a new account."
            }
        if (potentialUser.get('google') == False):
            salt = potentialUser.get('salt').encode("utf-8")
            hashedPassword = potentialUser.get('password').encode("utf-8")
            # Hash the provided password and compare it to the hash in the database
            givenPassPepper = hmac.new(b64encode(os.getenv("SECRET_PEPPER").encode("utf-8")), b64encode(givenPassword.encode("utf-8")), hashlib.sha256).digest()
            givenPassHash = bcrypt.hashpw(b64encode(givenPassPepper), salt)
            print(givenPassHash)
            print(hashedPassword)

            if (givenPassHash == hashedPassword):
                session["email"] = givenEmail
                session["chary_id"] = b64encode(os.urandom(32))
                return {
                    "status": 200,
                    "message": "Login successful!"
                }
            else:
                return {
                    "status": 400,
                    "message": "The password provided is not correct."
                }
        else:
            return {
                "status": 400,
                "message": 'This email was used to sign up via Google Sign In. In order to log in, please click the "Sign in with Google" button.'
            }
    except Exception as e:
        print(e)
        return {
                "status": 400,
                "message": str(e) + "."
            }


@app.route("/data/create-user/chary", methods=['POST'])
def createUserChary():
    email = request.json["email"]
    username = ""
    password = request.json["password"]
    image = ""
    color = ""
    currency = ""
    balance = 0
    tutorialFinished = False
    profileCreation = False
    google = False

    salt = bcrypt.gensalt()
    pepperedPass = hmac.new(b64encode(os.getenv("SECRET_PEPPER").encode("utf-8")), b64encode(password.encode("utf-8")), hashlib.sha256).digest()
    hashedPass = bcrypt.hashpw(b64encode(pepperedPass), salt)

    try:
        database.createUser(
            email, 
            username,
            hashedPass.decode("utf-8"),
            salt.decode("utf-8"),
            image,
            color,
            currency, 
            balance,
            tutorialFinished, 
            profileCreation,
            google 
        )
        
        session["email"] = email
        session["chary_id"] = b64encode(os.urandom(32))

        return {
            "status": 201,
            "message": "Creation successful!"
        }
    except Exception as e:
        return {
            "status": 400,
            "message": str(e)
        }

@app.route("/data/create-user/google", methods=['POST'])
def createUserGoogle():
    email = session["email"]
    username = ""
    password = request.json["password"]
    salt = ""
    image = ""
    color = ""
    currency = ""
    balance = 0
    tutorialFinished = False
    profileCreation = False
    google = True

    try:
        database.createUser(
            email, 
            username,
            password,
            salt,
            image,
            color,
            currency, 
            balance,
            tutorialFinished, 
            profileCreation,
            google 
        )
        return {
            "status": 201,
            "message": "Creation successful!"
        }
    except Exception as e:
        return {
            "status": 400,
            "message": str(e)
        }

#######################################
# Pages that need authenticated login #
#######################################

@app.route("/dashboard")
@login_is_required
def renderDashboard():
    refresh = request.args.get("refresh")
    tab = request.args.get("tab")
    if refresh == None:
        if tab == None:
            return render_template('dashboard.html', refresh="true", tab="overview", nav=renderedNav())
        else:
            return render_template('dashboard.html', refresh="true", tab=tab, nav=renderedNav())
    else:
        return render_template('dashboard.html', refresh=refresh, tab=tab, nav=renderedNav())

@app.route("/expand-budget")
@login_is_required
def renderBudget():
    return render_template('budget.html', id=request.args.get('id'), nav=renderedNav())

@app.route("/profile")
@login_is_required
def renderProfile():
    return render_template('profile.html', nav=renderedNav())

##########################################
# Add, Create, and Delete form rendering #
##########################################

@app.route("/form/create-user")
@login_is_required
def renderCreateUser():
    return render_template('create-user.html', nav=renderedNav())

@app.route("/form/create-budget")
@login_is_required
def renderCreateBudget():
    return render_template('create-budget.html', nav=renderedNav())

@app.route("/form/create-earning")
@login_is_required
def renderCreateEarning():
    return render_template('create-earning.html', nav=renderedNav())

@app.route('/form/create-expense')
@login_is_required
def renderCreateExpense():
    categoryInfo = database.getBudgetCategories(session["email"])
    return render_template('create-expense.html', allCategories=categoryInfo, nav=renderedNav())

@app.route("/form/update-user")
@login_is_required
def renderUpdateUser():
    try: 
        # This database method checks to make sure that the user owns the expense they are trying to update
        databaseInfo = database.getUser(session["email"])
        # TODO: Autofill with current user data

        return render_template('update-user.html', nav=renderedNav())
    except Exception as e:
        return custom_error(e)

@app.route("/form/update-budget")
@login_is_required
def renderUpdateBudget():
    try: 
        budgetId = request.args.get("id")

        # This database method checks to make sure that the user owns the budget they are trying to update
        budgetInfo = database.getBudget(budgetId, session["email"])

        return render_template(
            'update-budget.html', 
            id=budgetId,
            name=budgetInfo["name"],
            description=budgetInfo["description"],
            amount=budgetInfo["amount"],
            startDate=budgetInfo["startDate"],
            recurPeriod=budgetInfo["budgetPeriod"],
            recurring=budgetInfo["recurring"],
            endDate=budgetInfo["endDate"], 
            nav=renderedNav()
        )
    except Exception as e:
        return custom_error(e)
    
@app.route('/form/update-expense')
@login_is_required
def renderUpdateExpense():
    try:
        expenseId = request.args.get("id")

        # This database method checks to make sure that the user owns the expense they are trying to update
        databaseInfo = database.getExpense(expenseId, session["email"])
        expenseInfo = databaseInfo["data"]
        categoryInfo = databaseInfo["budgetCategories"]

        return render_template(
            'update-expense.html', 
            id=expenseId,
            name=expenseInfo["name"], 
            description=expenseInfo["description"], 
            amount=expenseInfo["amount"],
            startDate=expenseInfo["startDate"],
            recurPeriod=expenseInfo["recurPeriod"], 
            recurring=expenseInfo["recurring"],
            category=expenseInfo["budgetCategory"],
            allCategories=categoryInfo,
            endDate=expenseInfo["endDate"], 
            nav=renderedNav()
        )
    except Exception as e:
        return custom_error(e)
        
@app.route("/form/update-earning")
@login_is_required
def renderUpdateEarning():
    try: 
        earningId = request.args.get("id")

        # This database method checks to make sure that the user owns the expense they are trying to update
        earningInfo = database.getEarning(earningId, session["email"])

        return render_template(
            'update-earning.html', 
            id=earningId,
            name=earningInfo["name"],
            description=earningInfo["description"],
            amount=earningInfo["amount"],
            startDate=earningInfo["startDate"],
            recurPeriod=earningInfo["recurPeriod"],
            recurring=earningInfo["recurring"],
            endDate=earningInfo["endDate"], 
            nav=renderedNav()
        )
    except Exception as e:
        return custom_error(e)
    
####################################################
# Routes for getting/updating database information #
####################################################

@app.route("/data/all-current")
@login_is_required
def getAllCurrent():
    try:
        period = request.args.get("period")
        targetDate = request.args.get("target")
        return database.getAllCurrent(session["email"], int(period), str(targetDate))
    except Exception as e:
        return custom_error(e)

@app.route("/data/user")
@login_is_required
def getAllUserData():
    return database.getUser(session["email"])

@app.route("/data/budgets")
@login_is_required
def getBudgetData():
    try:
        period = request.args.get("period")
        targetDate = request.args.get("target")

        if period and targetDate:
            return database.getAllActiveBudgets(session["email"], period, targetDate)
        else:
            return database.getAllActiveBudgets(session["email"])
    except Exception as e:
        return custom_error(e)

@app.route("/data/expenses")
@login_is_required
def getExpenseData():
    try:
        period = request.args.get("period")
        targetDate = request.args.get("target")

        if period and targetDate:
            startDate, endDate = database.getDatesFromPeriod(period, targetDate)
            return database.getExpensesInRange(session["email"], startDate, endDate)

    except Exception as e:
        return custom_error(e)

@app.route("/data/earnings")
@login_is_required
def getEarningData():
    try:
        period = request.args.get("period")
        targetDate = request.args.get("target")

        if period and targetDate:
            startDate, endDate = database.getDatesFromPeriod(period, targetDate)
            return database.getEarningsInRange(session["email"], startDate, endDate)

    except Exception as e:
        return custom_error(e)

@app.route("/data/get-budget")
@login_is_required
def getOneBudget():
    budgetId = request.args.get("id")
    date = request.args.get("date")
    if date == None:
        return database.getBudget(budgetId, session["email"])
    else:
        return database.getBudget(budgetId, session["email"], date)
    
@app.route("/data/budget-expenses")
@login_is_required
def getBudgetExpenses():
    try:
        budgetId = request.args.get("id")
        date = request.args.get("date")
        if date == None:
            return database.getBudgetAndExpenses(session["email"], budgetId)
        else:
            return database.getBudgetAndExpenses(session["email"], budgetId, date)
    except Exception as e:
        return custom_error(e)
    
@app.route("/data/get-expense/")
@login_is_required
def getOneExpense():
    expenseId = request.args.get("id")
    return database.getExpense(expenseId, session["email"])

@app.route("/data/get-earning", methods=['POST'])
@login_is_required
def getOneEarning():
    earningId = request.args.get("id")
    return database.getEarning(earningId, session["email"])

@app.route("/data/create-budget", methods=['POST'])
@login_is_required
def createBudget():
    name = request.json["name"] if bool(request.json["name"]) else ""
    description = request.json["description"] if bool(request.json["description"]) else ""
    amount = request.json["amount"] if bool(request.json["amount"]) else ""
    recurPeriod = request.json["radio"] if bool(request.json["radio"]) else 0
    startDate = request.json["start"] if bool(request.json["start"]) else ""
    endDate = request.json["end"] if bool(request.json["end"]) else ""
    recurring = True if request.json["recurring"] == 'True' else False

    try:
        database.createBudget(
            session["email"], 
            name, 
            startDate,
            endDate,
            amount,
            description, 
            recurring,
            recurPeriod
        )
        return {
            "status": 201,
            "message": "Creation successful!"
        }
    except Exception as e:
        return {
            "status": 400,
            "message": str(e)
        }

@app.route("/data/create-expense", methods=['POST'])
@login_is_required
def createExpense():
    name = request.json["name"] if bool(request.json["name"]) else ""
    amount = request.json["amount"] if bool(request.json["amount"]) else ""
    category = request.json["category"] if bool(request.json["category"]) else ""
    description = request.json["description"] if bool(request.json["description"]) else ""
    recurPeriod = request.json["radio"] if bool(request.json["radio"]) else ""
    startDate = request.json["start"] if bool(request.json["start"]) else ""
    endDate = request.json["end"] if bool(request.json["end"]) else ""
    recurring = True if request.json["recurring"] == 'True' else False
    try:
        database.createExpense(
            session["email"], 
            name,
            category, 
            startDate,
            endDate,
            amount, 
            description, 
            recurPeriod, 
            recurring
        )
        return {
            "status": 201,
            "message": "Creation successful!"
        }
    except Exception as e:
        return {
            "status": 400,
            "message": str(e)
        }
    
@app.route("/data/create-earning", methods=['POST'])
@login_is_required
def createEarning():
    name = request.json["name"] if bool(request.json["name"]) else ""
    amount = request.json["amount"] if bool(request.json["amount"]) else ""
    description = request.json["description"] if bool(request.json["description"]) else ""
    recurPeriod = request.json["radio"] if bool(request.json["radio"]) else ""
    startDate = request.json["start"] if bool(request.json["start"]) else ""
    endDate = request.json["end"] if bool(request.json["end"]) else ""
    recurring = True if request.json["recurring"] == 'True' else False

    try:
        database.createEarning(
            session["email"], 
            name,
            startDate,
            endDate,
            amount, 
            description, 
            recurPeriod, 
            recurring
        )
        return {
            "status": 201,
            "message": "Creation successful!"
        }
    except Exception as e:
        return {
            "status": 400,
            "message": str(e)
        }

@app.route("/data/update-user", methods=['POST'])
@login_is_required
def updateUser():
    username = request.json["username"]
    image = request.json["profile-image"]
    color = request.json["profile-color"]
    currency = request.json["currency"]
    balance = request.json["balance"]
    try:
        database.updateUser(
            session["email"], 
            username, 
            image, 
            color,
            currency,
            balance
        )
        return {
            "status": 201,
            "message": "Update successful!"
        }
    except Exception as e:
        return {
            "status": 400,
            "message": str(e)
        }

@app.route("/data/update-budget", methods=['POST'])
@login_is_required
def updateBudget():
    id = request.json["id"]
    name = request.json["name"] if bool(request.json["name"]) else ""
    description = request.json["description"] if bool(request.json["description"]) else ""
    amount = request.json["amount"] if bool(request.json["amount"]) else ""
    budgetPeriod = request.json["radio"] if bool(request.json["radio"]) else 0
    startDate = request.json["start"] if bool(request.json["start"]) else ""
    endDate = request.json["end"] if bool(request.json["end"]) else ""
    recurring = True if request.json["recurring"] == 'True' else False
    try:
        database.updateBudget(
            session["email"], 
            id,
            name,
            startDate,
            endDate, 
            amount,
            description, 
            budgetPeriod, 
            recurring
        )
        return {
            "status": 201,
            "message": "Update successful!"
        }
    except Exception as e:
        return {
            "status": 400,
            "message": str(e)
        }

@app.route("/data/update-expense", methods=['POST'])
@login_is_required
def updateExpense():
    id = request.json["id"]
    name = request.json["name"] if bool(request.json["name"]) else ""
    amount = request.json["amount"] if bool(request.json["amount"]) else ""
    category = request.json["category"] if bool(request.json["category"]) else ""
    description = request.json["description"] if bool(request.json["description"]) else ""
    recurPeriod = request.json["radio"] if bool(request.json["radio"]) else ""
    startDate = request.json["start"] if bool(request.json["start"]) else ""
    endDate = request.json["end"] if bool(request.json["end"]) else ""
    recurring = True if request.json["recurring"] == 'True' else False
    
    try:
        database.updateExpense(
            session["email"], 
            id, 
            name,
            category, 
            startDate,
            endDate,
            amount, 
            description, 
            recurPeriod, 
            recurring
        )
        return {
            "status": 201,
            "message": "Update successful!"
        }
    except Exception as e:
        return {
            "status": 400,
            "message": str(e)
        }

@app.route("/data/update-earning", methods=['POST'])
@login_is_required
def updateEarning():
    id = request.json["id"]
    name = request.json["name"] if bool(request.json["name"]) else ""
    amount = request.json["amount"] if bool(request.json["amount"]) else ""
    description = request.json["description"] if bool(request.json["description"]) else ""
    recurPeriod = request.json["radio"] if bool(request.json["radio"]) else ""
    startDate = request.json["start"] if bool(request.json["start"]) else ""
    endDate = request.json["end"] if bool(request.json["end"]) else ""
    recurring = True if request.json["recurring"] == 'True' else False
    
    try:
        database.updateEarning(
            session["email"], 
            id, 
            name, 
            startDate,
            endDate,
            amount,
            description, 
            recurPeriod, 
            recurring
        )
        return {
            "status": 201,
            "message": "Update successful!"
        }
    except Exception as e:
        return {
            "status": 400,
            "message": str(e)
        }

##########################################
# Routes for delete database information #
##########################################
@app.route("/data/delete-user", methods=['DELETE'])
@login_is_required
def deleteUser():
    try:
        database.deleteUser(session["email"])
        return {
            "status": 200,
            "message": "Delete successful!"
        }
    except Exception as e:
        return custom_error(e) 

@app.route("/data/delete-budget", methods=['DELETE'])
@login_is_required
def deleteBudget():
    budgetId = request.json["id"]
    try:
        database.deleteBudget(session["email"], budgetId)
        return {
            "status": 200,
            "message": "Delete successful!"
        }
    except Exception as e:
        return custom_error(e)

@app.route("/data/delete-expense", methods=['DELETE'])
@login_is_required
def deleteExpense():
    expenseId = request.json["id"]
    try:
        database.deleteExpense(session["email"], expenseId)
        return {
            "status": 200,
            "message": "Delete successful!"
        }
    except Exception as e:
        return custom_error(e)

@app.route("/data/delete-earning", methods=['DELETE'])
@login_is_required
def deleteEarning():
    earningId = request.json["id"]
    try:
        database.deleteEarning(session["email"], earningId)
        return {
            "status": 200,
            "message": "Delete successful!"
        }
    except Exception as e:
        return custom_error(e)

##########################################################
# Error handling to tell users more helpful information  #
##########################################################

@app.errorhandler(401)
def notLoggedInError(error):
    error=[
        "Wait! You're not logged in yet!",
        "To view this page, you have to first log in. "
    ]
    return render_template('errorPage.html', error=error, loggedIn=isLoggedIn(), nav=renderedNav(), showLogin=True), 404

@app.errorhandler(405)
def unauthorizedAccessAttempt(error):
    error=[
        "You don't have the authority to view this page!",
        "Make sure you are properly logged in to the correct account. "
    ]
    return render_template('errorPage.html', error=error, loggedIn=isLoggedIn(), nav=renderedNav(), showLogin=True), 404

@app.errorhandler(403)
def loginFailed(error):
    error=[
        "Login failed :(",
        "Something went wrong while logging in. Please try again."
    ]
    return render_template('errorPage.html', error=error, loggedIn=isLoggedIn(), nav=renderedNav(), showLogin=True), 404

@app.errorhandler(500)
def page_not_found(error):
    error=[
        "Whoops! That's my fault 😓",
        "The thing you clicked on is broken right now."
    ]
    return render_template('errorPage.html', error=error, loggedIn=isLoggedIn(), nav=renderedNav()), 404

def custom_error(message):
    error=[
        "Something went wrong:",
        message
    ]
    return render_template('errorPage.html', error=error, loggedIn=isLoggedIn(), nav=renderedNav()), 404