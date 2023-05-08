import firebase_admin
from firebase_admin import firestore
from flask import jsonify

import argon2
# Used to hash IDs of entities when they are returned to the client for updating
# This will be a second security measure to make sure that only the correct
# user, updating the correct ID will be allowed to post changes to the database.
argon2Hasher = argon2.PasswordHasher(
    time_cost=2,
    memory_cost=64,
    parallelism=1,
    hash_len=32,
    salt_len=16,
    type=argon2.low_level.Type(2)
)

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

        budgetCategories.append(budgetsDict[budgetDoc.id]['name'])
    
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
def getAllBudgets(email):
    budgetList = getUser(email)['data']['budgets']
    budgetsDict = {}
    budgetCategories = []
    
    # Loop through the budgetlist, making requests to the database
    for budgetID in budgetList:
        if budgetID == "":
            continue
        budgetDoc = db.collection(u'budgets').document(budgetID).get()
        budgetsDict[budgetDoc.id] = budgetDoc.to_dict()

        budgetCategories.append(budgetsDict[budgetDoc.id]['name'])

    return {"data":budgetsDict, "categories":budgetCategories}

# Get a user's expenses
def getAllExpenses(email):
    user = getUser(email)['data']
    expenseList = user['expenses']
    expensesDict = {}
    
    # Loop through the expenselist, making requests to the database
    for expenseID in expenseList:
        if expenseID == "":
            continue
        expenseDoc = db.collection(u'expenses').document(expenseID).get()
        expensesDict[expenseDoc.id] = expenseDoc.to_dict()

    # Get a list of budget categories
    budgetCategories = getBudgetCategories(email)

    return {"data":expensesDict, "categories":budgetCategories}

# Get a list of budget categories associated with a given user
def getBudgetCategories(email):
    user = getUser(email)['data']
    budgetList = user['budgets']
    budgetCategories = []

    for budgetID in budgetList:
        budget = db.collection(u'budgets').document(budgetID).get().to_dict()
        budgetCategories.append(budget["name"])

    return budgetCategories


def getExpense(expenseId, userEmail):
    if (expenseId == "" or userEmail == ""):
        raise RuntimeError("No expense ID or email provided.")
    
    user = getUser(userEmail)['data']
    if (expenseId not in user['expenses']):
        raise RuntimeError("User email does not match expense!")
    
    expenseDoc = db.collection(u'expenses').document(expenseId).get()
    budgetCategories = getBudgetCategories(userEmail)

    return {"expense":expenseDoc.to_dict(), "budgetCategories":budgetCategories}

def getBudget(budgetId, userEmail):
    if (budgetId == "" or userEmail == ""):
        raise RuntimeError("No budget ID or email provided.")
    
    user = getUser(userEmail)['data']
    if (budgetId not in user['budgets']):
        raise RuntimeError("User email does not match budget!")
    
    budgetDoc = db.collection(u'budgets').document(budgetId).get()

    return budgetDoc.to_dict()

def getEarning(earningId, userEmail):
    if (earningId == "" or userEmail == ""):
        raise RuntimeError("No earning ID or email provided.")
    
    user = getUser(userEmail)['data']
    if (earningId not in user['earnings']):
        raise RuntimeError("User email does not match earning!")
    
    earningDoc = db.collection(u'earnings').document(earningId).get()

    return earningDoc.to_dict()

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