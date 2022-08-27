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

app = Flask(__name__, template_folder="templates")
# Load environment variables and set secret key
load_dotenv()

app.secret_key = os.getenv("SECRET_KEY")
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
CONFIG_URL = os.getenv("CONFIG_URL")

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
    authorization_url, state = flow.authorization_url()
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

    session["google_id"] = id_info.get("sub")
    session["name"] = id_info.get("name")
    return redirect("/dashboard")


#######################################
# Pages that need authenticated login #
#######################################

@app.route("/dashboard")
@login_is_required
def renderDashboard():
    return render_template('dashboard.html', user_name=session["name"])

@app.route("/budget")
@login_is_required
def renderBudget():
    return render_template('budget.html')

@app.route("/expense")
@login_is_required
def renderExpense():
    return render_template('expense.html')

##########################################################
# Error handling to tell users more helpful information  #
##########################################################

@app.errorhandler(401)
def page_not_found(error):
    error=[
        "Wait! You're not logged in yet!",
        "To view this page, you have to first log in. "
    ]
    return render_template('errorPage.html', error=error, showLogin=True, showDashboard=False), 404

@app.errorhandler(500)
def page_not_found(error):
    error=[
        "Whoops! That's my fault 😓",
        "The thing you clicked on is broken right now."
    ]
    return render_template('errorPage.html', error=error, showLogin=False, showDashboard=False), 404