from flask import Flask, render_template
# from database import getData, getProject

app = Flask(__name__, template_folder="templates")

@app.route("/")
def renderHome():
    return render_template('landing.html')

@app.route("/dashboard", methods=['GET'])
def renderHomeScroll(scrollTo):
    return render_template('dashboard.html', scroll=scrollTo)

@app.route("/budget", methods=['GET','POST'])
def renderProjectInfo(projectID):
    return render_template('budget.html')

@app.route("/expense", methods=['GET','POST'])
def loadProjectData(projectID):    
    return render_template('expense.html')
