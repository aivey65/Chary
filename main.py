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

from database import getAll, getUser, getBudgets, getExpenses

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

@app.route("/acd-budget/<id>")
@login_is_required
def renderACDBudget():
    return render_template('acd-budget.html', id=id)

@app.route("/acd-earning/<id>")
@login_is_required
def renderACDEarning():
    return render_template('acd-earning.html', id=id)

@app.route("/acd-expense/<id>")
@login_is_required
def renderACDExpense():
    return render_template('acd-expense.html', id=id)

####################################################
# Routes for getting/updating database information #
####################################################

@app.route("/data/all")
@login_is_required
def getAllData():
    return getAll(session["email"])

@app.route("/data/user")
@login_is_required
def getUserData():
    return getUser(session["email"])

@app.route("/data/budgets")
@login_is_required
def getBudgetData():
    return getBudgets(session["email"])

@app.route("/data/expenses")
@login_is_required
def getExpenseData():
    return getExpenses(session["email"])

@app.route("/data/acd-user")
@login_is_required
def updateUser():
    return updateUser(session["email"])

@app.route("/data/acd-budget")
@login_is_required
def updateBudget():
    id = request.form.get("Id")
    name = request.form.get("bname")
    description = request.form.get("bdescription")
    amount = request.form.get("bamount")
    amountUsed = request.form.get("bamountused")
    earningPeriod = request.form.get("bradio")
    startDate = request.form.get("bstart")
    recurring = request.form.get("brecurring")

    return updateBudget(
        session["email"], 
        id, 
        name, 
        description, 
        amount,
        startDate,
        amountUsed,
        earningPeriod, 
        recurring
    )

@app.route("/data/acd-earning")
@login_is_required
def updateEarning():
    id = request.form.get("Id")
    name = request.form.get("ename")
    description = request.form.get("edescription")
    amount = request.form.get("eamount")
    earningPeriod = request.form.get("eradio")
    startDate = request.form.get("estart")
    recurring = request.form.get("erecurring")

    return updateEarning(
        session["email"], 
        id, 
        name, 
        description, 
        amount,
        startDate,
        earningPeriod, 
        recurring
    )

@app.route("/data/acd-expense")
@login_is_required
def updateExpense():
    id = request.form.get("Id")
    name = request.form.get("exname")
    description = request.form.get("exdescription")
    amount = request.form.get("examount")
    earningPeriod = request.form.get("exradio")
    startDate = request.form.get("exstart")
    recurring = request.form.get("exrecurring")

    return updateExpense(
        session["email"], 
        id, 
        name, 
        description, 
        amount,
        startDate,
        earningPeriod, 
        recurring
    )
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