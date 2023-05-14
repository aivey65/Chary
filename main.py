import imp
import os
from dotenv import load_dotenv
import pathlib
import requests
from flask import Flask, session, abort, redirect, request, render_template
from google.oauth2 import id_token
from google_auth_oauthlib.flow import Flow
from pip._vendor import cachecontrol
import google.auth.transport.requests
from functools import wraps

import database

app = Flask(__name__, template_folder="templates")
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
    return render_template('landing.html')

@app.route("/about")
def renderAbout():
    return render_template('about.html')

@app.route("/login")
def renderLogin():
    return render_template('login.html')

@app.route("/privacy")
def renderPrivacyPolicy():
    return render_template('privacy-policy.html')

####################################
# Functions for logging in and out #
####################################

def login_is_required(function):
    @wraps(function)
    def wrapper(*args, **kwargs):
        if "google_id" not in session:
            return abort(401)
        else:
            return function()

    return wrapper

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
        audience=CLIENT_ID
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


#######################################
# Pages that need authenticated login #
#######################################

@app.route("/dashboard")
@login_is_required
def renderDashboard():
    return render_template('dashboard.html')

@app.route("/budget")
@login_is_required
def renderBudget():
    return render_template('budget.html')

@app.route("/expense")
@login_is_required
def renderExpense():
    return render_template('expense.html')

@app.route("/acd-budget")
@login_is_required
def renderACDBudget():
    budgetId = request.args.get("id")
    return render_template('update-budget.html', id=budgetId)

@app.route("/acd-earning")
@login_is_required
def renderACDEarning():
    earningId = request.args.get("id")
    return render_template('update-earning.html', id=earningId)

@app.route('/acd-expense')
@login_is_required
def renderACDExpense():
    expenseId = request.args.get("id")
    if (expenseId != "-1"):
        try:
            # This database method checks to make sure that the user owns the expense they are trying to update
            databaseInfo = database.getExpense(expenseId, session["email"])
            expenseInfo = databaseInfo["expense"]
            categoryInfo = databaseInfo["budgetCategories"]
            predictedAmount = expenseInfo["expectedAmount"] if expenseInfo["expectedAmount"] != -1 else ""

            return render_template(
                'update-expense.html', 
                id=expenseId,
                name=expenseInfo["name"], 
                description=expenseInfo["description"], 
                amount=expenseInfo["actualAmount"],
                predicted=predictedAmount,
                startDate=expenseInfo["startDate"],
                recurPeriod=expenseInfo["recurPeriod"], 
                recurring=expenseInfo["recurring"],
                category=expenseInfo["budgetCategory"],
                allCategories=categoryInfo
            )
        except Exception as e:
            print(e)
            abort(405)
    else:
        categoryInfo = database.getBudgetCategories(session["email"])
        return render_template(
            'create-expense.html', 
            id=expenseId,
            name="", 
            description="", 
            amount="",
            predicted="",
            startDate="",
            recurPeriod="One Time", 
            recurring=False,
            category="",
            allCategories=categoryInfo
        )


####################################################
# Routes for getting/updating database information #
####################################################

@app.route("/data/all")
@login_is_required
def getAllData():
    return database.getAll(session["email"])

@app.route("/data/user")
@login_is_required
def getAllUserData():
    return database.getUser(session["email"])

@app.route("/data/budgets")
@login_is_required
def getAllBudgetData():
    return database.getAllBudgets(session["email"])

@app.route("/data/expenses")
@login_is_required
def getAllExpenseData():
    return database.getAllExpenses(session["email"])

@app.route("/data/get-budget")
@login_is_required
def getOneBudget():
    budgetId = request.args.get("id")
    return database.getBudget(budgetId, session["email"])
    
@app.route("/data/get-expense/")
@login_is_required
def getOneExpense():
    expenseId = request.args.get("id")
    return database.getExpense(expenseId, session["email"])

@app.route("/data/get-earning")
@login_is_required
def getOneEarning():
    earningId = request.args.get("id")
    return database.getEarning(earningId, session["email"])

@app.route("/data/create-user", methods=['POST'])
@login_is_required
def createUser():
    username = request.form.get("name")
    image = request.form.get("profile-image")
    color = request.form.get("profile-color")
    currency = request.form.get("currency")
    balance = 0
    tutorialFinished = False
    profileCreation = False

    try:
        database.createUser(
            session["email"], 
            username,
            image,
            color,
            currency, 
            balance,
            tutorialFinished, 
            profileCreation, 
        )
        return redirect("/dashboard")
    except Exception as e:
        return custom_error(e)

@app.route("/data/create-budget", methods=['POST'])
@login_is_required
def createBudget():
    name = request.form.get("name")
    description = request.form.get("description")
    amount = request.form.get("amount")
    budgetPeriod = request.form.get("radio")
    startDate = request.form.get("start")
    endDate = request.form.get("end")
    recurring = request.form.get("recurring")
    predicted = request.form.get("predicted")

    try:
        database.createBudget(
            session["email"], 
            name, 
            startDate,
            endDate,
            amount,
            description, 
            predicted,
            recurring,
            budgetPeriod, 
        )
        return redirect("/dashboard")
    except Exception as e:
        return custom_error(e)

@app.route("/data/create-expense", methods=['POST'])
@login_is_required
def createExpense():
    name = request.form.get("name")
    amount = request.form.get("amount")
    category = request.form.get("category")
    description = request.form.get("description")
    predicted = request.form.get("preamount")
    recurPeriod = request.form.get("radio")
    startDate = request.form.get("start")
    endDate = request.form.get("end")
    recurring = request.form.get("recurring")
    try:
        database.createExpense(
            session["email"], 
            name,
            category, 
            startDate,
            endDate,
            amount, 
            description, 
            predicted,
            recurPeriod, 
            recurring
        )
        return redirect("/dashboard")
    except Exception as e:
        return custom_error(e)

@app.route("/data/update-user", methods=['POST'])
@login_is_required
def updateUser():
    id = request.form.get("id")
    username = request.form.get("username")
    image = request.form.get("profile-image")
    color = request.form.get("profile-color")
    currency = request.form.get("currency")
    balance = request.form.get("balance")
    try:
        database.updateUser(
            session["email"], 
            username, 
            image, 
            color,
            currency,
            balance
        )
        return redirect("/dashboard")
    except Exception as e:
        return custom_error(e)

@app.route("/data/update-budget")
@login_is_required
def updateBudget():
    id = request.form.get("id")
    name = request.form.get("name")
    description = request.form.get("description")
    amount = request.form.get("amount")
    budgetPeriod = request.form.get("radio")
    startDate = request.form.get("start")
    endDate = request.form.get("end")
    recurring = request.form.get("recurring")
    predicted = request.form.get("predicted")

    try:
        database.updateBudget(
            session["email"], 
            id, 
            name,
            startDate,
            endDate, 
            amount,
            description, 
            predicted,
            budgetPeriod, 
            recurring
        )
        return redirect("/dashboard")
    except Exception as e:
        custom_error(e)

@app.route("/data/update-expense", methods=['POST'])
@login_is_required
def updateExpense():
    id = request.form.get("id")
    name = request.form.get("name")
    amount = request.form.get("amount")
    category = request.form.get("category")
    description = request.form.get("description")
    predicted = request.form.get("preamount")
    recurPeriod = request.form.get("radio")
    startDate = request.form.get("start")
    endDate = request.form.get("end")
    recurring = request.form.get("recurring")
    
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
            predicted,
            recurPeriod, 
            recurring
        )
        return redirect("/dashboard")
    except Exception as e:
        return custom_error(e)

@app.route("/data/update-earning")
@login_is_required
def updateEarning():
    id = request.form.get("id")
    name = request.form.get("name")
    amount = request.form.get("amount")
    predicted = request.form.get("preamount")
    description = request.form.get("description")
    recurPeriod = request.form.get("radio")
    startDate = request.form.get("start")
    endDate = request.form.get("end")
    recurring = request.form.get("recurring")
    
    try:
        database.updateEarning(
            session["email"], 
            id, 
            name, 
            startDate,
            endDate,
            amount,
            description, 
            predicted,
            recurPeriod, 
            recurring
        )
        return redirect("/dashboard")
    except Exception as e:
        custom_error(e)

##########################################
# Routes for delete database information #
##########################################
@app.route("/data/delete-user")
@login_is_required
def deleteUser():
    try:
        database.deleteUser(session["email"])
    except Exception as e:
        custom_error(e) 

@app.route("/data/delete-budget")
@login_is_required
def deleteBudget():
    budgetId = request.form.get("Id")
    try:
        database.deleteBudget(session["email"], budgetId)
    except Exception as e:
        custom_error(e)

@app.route("/data/delete-expense")
@login_is_required
def deleteExpense():
    expenseId = request.form.get("Id")
    try:
        database.deleteExpense(session["email"], expenseId)
    except Exception as e:
        custom_error(e)

@app.route("/data/delete-earning")
@login_is_required
def deleteEarning():
    earningId = request.form.get("Id")
    try:
        database.deleteEarning(session["email"], earningId)
    except Exception as e:
        custom_error(e)

##########################################################
# Error handling to tell users more helpful information  #
##########################################################

@app.errorhandler(401)
def notLoggedInError(error):
    error=[
        "Wait! You're not logged in yet!",
        "To view this page, you have to first log in. "
    ]
    return render_template('errorPage.html', error=error, showLogin=True, showDashboard=False), 404

@app.errorhandler(405)
def unauthorizedAccessAttempt(error):
    error=[
        "You don't have the authority to view this page!",
        "Make sure you are properly logged in to the correct account. "
    ]
    return render_template('errorPage.html', error=error, showLogin=True, showDashboard=False), 404

@app.errorhandler(403)
def loginFailed(error):
    error=[
        "Login failed :(",
        "Something went wrong while logging in. Please try again."
    ]
    return render_template('errorPage.html', error=error, showLogin=True, showDashboard=False), 404

@app.errorhandler(500)
def page_not_found(error):
    error=[
        "Whoops! That's my fault 😓",
        "The thing you clicked on is broken right now."
    ]
    return render_template('errorPage.html', error=error, showLogin=False, showDashboard=False), 404

def custom_error(message):
    error=[
        "Something went wrong:",
        message
    ]
    return render_template('errorPage.html', error=error, showLogin=False, showDashboard=False), 404