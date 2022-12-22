import firebase_admin
from firebase_admin import firestore
from flask import jsonify

# Application Default credentials are automatically created.
app = firebase_admin.initialize_app()
db = firestore.client()

####################
# Getter functions #
####################
# Get all data associated with a user (basic data, expenses, and budgets)
def getAll(email):
    user = getUser(email)['data']
    budgetsDict = {}
    expensesDict = {}
    budgetCategories = []

    for budgetID in user['budgets']:
        if budgetID == "":
            continue
        budgetDoc = db.collection(u'budgets').document(budgetID).get()
        budgetsDict[budgetDoc.id] = budgetDoc.to_dict()

        print(budgetDoc["name"])
        budgetCategories.append(budgetDoc["name"])
    
    for expenseID in user['expenses']:
        if expenseID == "":
            continue
        expenseDoc = db.collection(u'expenses').document(expenseID).get()
        expensesDict[expenseDoc.id] = expenseDoc.to_dict()

    user['budgets'] = budgetsDict
    user['expenses'] = expensesDict
    user['budgetCategories'] = budgetCategories

    return {"data":user}

# Get a user's basic information, needed to get list of budgets, expenses, etc.
def getUser(email):
    # Note: Use of CollectionRef stream() is prefered to get()
    docs = db.collection(u'users').where(u'email', u'==', email).stream()

    for doc in docs: # Should only run once, since an email should only be present once in database
        return {"data":doc.to_dict()}

    return 

# Get a user's budgets
def getBudgets(email):
    budgetList = getUser(email)['data']['budgets']
    budgetsDict = {}
    
    # Loop through the budgetlist, making requests to the database
    for budgetID in budgetList:
        budgetDoc = db.collection(u'budgets').document(budgetID).get()
        budgetsDict[budgetDoc.id] = budgetDoc.to_dict()

    return {"data":budgetsDict}

# Get a user's expenses
def getExpenses(email):
    user = getUser(email)['data']
    expenseList = user['expenses']
    expensesDict = {}
    
    # Loop through the expenselist, making requests to the database
    for expenseID in expenseList:
        expenseDoc = db.collection(u'expenses').document(expenseID).get()
        expensesDict[expenseDoc.id] = expenseDoc.to_dict()

    # Get a list of budget categories
    budgetList = user['budgets']
    budgetCategories = []
    for budgetID in budgetList:
        budgetName = db.collection(u'budgets').document(budgetID).select("name").get()
        print(budgetName)
        budgetCategories.append(budgetName)

    return {"data":expensesDict, "categories":budgetCategories}

####################
# Setter functions #
####################
def updateUser(email):
    pass

def updateBudget(email, id, name, amount, startDate, description="", amountUsed="", earningPeriod="One Time", recurring=False):
    budgetList = getUser(email)['data']['budgets']

    # Check to make sure that the id passed in corresponds to an item in the user's database
    if id in budgetList:
        print("Budget exists, update possible.")

def updateExpense(email, id, name, amount, startDate, description="", earningPeriod="One Time", recurring=False):
    expenseList = getUser(email)['data']['expenses']

    # Check to make sure that the id passed in corresponds to an item in the user's database
    if id in expenseList:
        print("Expense exists, update possible.")



def updateEarning(email, id, name, amount, startDate, description="", earningPeriod="One Time", recurring=False):
    pass