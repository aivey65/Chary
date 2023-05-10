import firebase_admin
from firebase_admin import firestore
from flask import jsonify
from datetime import date

# Application Default credentials are automatically created.
app = firebase_admin.initialize_app()
db = firestore.client()

####################
# Create functions #
####################
def createUser(email, username, image, color, currency, balance):
    newUser = {
        u'email': email,
        u'username': username,
        u'profileImage': image,
        u'profileColor': color,
        u'currency': currency,
        u'balance': balance,
        u'budgets': [], 
        u'earnings': [],
        u'expenses': [],
        u'joinDate': date.today()
    }

def createBudget(email, name, startDate, amount=0, description="", predicted=0, recurPeriod="Monthly"):
    newBudget = {
        u'email': email,
        u'name': name,
        u'date': startDate,
        u'actualBudgetAmount': amount,
        u'description': description,
        u'expectedBudgetAmount': predicted,
        u'budgetPeriod': recurPeriod,
        u'usedAmount': 0
    }

    create_datetime, budget_ref = db.collection(u'budgets').add(newBudget)

    # Add the newly created budgetId to the list of budgets in the user document
    try :
        updateUserReferenceIds(email, 0, 'budgets', budget_ref.id)
    except Exception as e:
        emergencyDeleteBudget(budget_ref.id)
        raise e


def createExpense(email, name, category, startDate, amount=0, description="", predicted=0, recurPeriod="One Time", recurring=False):
    newExpense = {
        u'name': name,
        u'category': category,
        u'date': startDate,
        u'actualAmount': amount,
        u'description': description,
        u'expectedAmount': predicted,
        u'recurPeriod': recurPeriod,
        u'recurring': recurring
    }

    create_datetime, expense_ref = db.collection(u'expenses').add(newExpense)

    # Add the newly created expenseID to the list of expenses in the user document
    try :
        updateUserReferenceIds(email, 0, 'expenses', expense_ref.id)
    except Exception as e:
        emergencyDeleteExpense(expense_ref.id)
        raise e
    
    # Expenses also must update the budget associated with them.


def createEarning(email, name, startDate, amount=0, description="", predicted=0, recurPeriod="One Time", recurring=False):
    newEarning = {
        u'name': name,
        u'date': startDate,
        u'actualAmount': amount,
        u'description': description,
        u'expectedAmount': predicted,
        u'recurPeriod': recurPeriod,
        u'recurring': recurring
    }

    create_datetime, earning_ref = db.collection(u'earnings').add(newEarning)

    # Add the newly created earningID to the list of earnings in the user document
    try :
        updateUserReferenceIds(email, 0, 'earnings', earning_ref.id)
    except Exception as e:
        emergencyDeleteEarning(earning_ref.id)
        raise e

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
        budgetsDict[budgetID] = budgetDoc.to_dict()

        budgetCategories.append(budgetsDict[budgetID]['name'])

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
        expensesDict[expenseID] = expenseDoc.to_dict()

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
def updateUser(email, username, image, color, currency, balance):
    user = db.collection(u'users').where(u'email', u'==', email).stream()

    # Should only run once, since there should only be one user per email
    if user.length == 0:
        raise RuntimeError("Can't find user! Update failed.")
    elif user.length > 1:
        raise RuntimeError("Duplicate user found! Update failed.")
    else:
        user_ref = user[0]
        user_ref.update({
            u'username': username,
            u'profileImage': image,
            u'profileColor': color,
            u'currency': currency,
            u'balance': balance
        })

def updateUserReferenceIds(email, operation, refType, id):
    """
    'UpdateReferenceId' is for adding or removing reference IDs in a user's database entry.
    When a budget, earning, etc. is deleted, the reference to that entity must also be
    deleted from the list in the user's database.

    Parameters
    ------------
        email: string
            The email of the user that owns this new item
        operation: int
            Whether to add(0) or remove(1) the given id
        refType: string
            The type of entity the id refers to. Only accepts ["budgets", "earnings", "expenses", "goals"]
        id: string
            The ID generated by Firestore to be added or removed from the user.
    """
    if (email != None) and (operation == 1 or operation == 0) and (refType == 'budgets' or refType == 'expenses' or refType == 'earnings' or refType == 'goals'):
        user = db.collection(u'users').where(u'email', u'==', email).stream()

        # Should only run once, since there should only be one user per email
        if user.length == 0:
            raise RuntimeError("Can't find user! Update failed.")
        elif user.length > 1:
            raise RuntimeError("Duplicate user found! Update failed.")
        else:
            user_ref = user[0]

            if operation == 1: # Remove operation
                user_ref.update({
                    refType: firestore.ArrayRemove([id])
                })
            else: # Add operation
                user_ref.update({
                    refType: firestore.ArrayUnion([id])
                })
    else:
        raise RuntimeError("Update reference failed, invalid parameters!")

def updateBudget(email, id, name, startDate, amount=0, description="", predicted=0, amountUsed=0, recurPeriod="Monthly"):
    budgetList = getUser(email)['data']['budgets']

    # Check to make sure that the id passed in corresponds to an item in the user's database
    if id in budgetList:
        budget_ref = db.collection(u'budgets').document(id)
        budget_ref.update({
            u'name': name,
            u'date': startDate,
            u'actualBudgetAmount': amount,
            u'description': description,
            u'expectedBudgetAmount': predicted,
            u'budgetPeriod': recurPeriod,
        })
    else:
        raise RuntimeError("Verification failed, update canceled.")
    
def updateBudgetBalance(email, budgetId, amount):
    """
    Used to update the 'used amount' value in a budget. A user cannot update
    the used amount by updating the budget itself; the user must update their expenses.
    When a user adds or removes and expense, this method should be called to update
    the budget balance. This prevents the balance from getting messed up by accident,
    and keeps things synced.

    See also "syncBudgetBalance()" for re-syncing the balance using all expense values, just in
    case there is an unforseen mistake in updates.

    Parameters
    -------------

    """
    budgetList = getUser(email)['data']['budgets']

    # Check to make sure that the id passed in corresponds to an item in the user's database
    if budgetId in budgetList:
        budget_ref = db.collection(u'budgets').document(budgetId)
        currentAmount = budget_ref.select("usedAmount").get()
        budget_ref.update({
            u'usedAmount': currentAmount + amount,
        })
    else:
        raise RuntimeError("Verification failed, update canceled.")

def updateExpense(email, id, name, category, startDate, amount=0, description="", predicted=0, recurPeriod="One Time", recurring=False):
    expenseList = getUser(email)['data']['expenses']

    # Check to make sure that the id passed in corresponds to an item in the user's database
    if id in expenseList:
        expense_ref = db.collection(u'expenses').document(id)
        expenseInfo = expense_ref.get().to_dict()

        # If the user is updating the category, the current expense value must be removed from
        # it's current budget before adding the value to the new budget.
        if (expenseInfo['budgetCategory'] != category):
            budget_ref = db.collection(u'budgets').where(u'email', u'==', email).where(u'name', u'==', category).stream()
            if budget_ref.length == 0:
                raise RuntimeError("Can't find previous budget! Update failed.")
            elif budget_ref.length > 1:
                raise RuntimeError("Duplicate budget found! Update failed.")
            else:
                updateBudgetBalance(email, budget_ref.id, expenseInfo['actualAmount'])

        # In case the user changes the expense amount, or the budget category,
        # we must be prepared to update the budget balance as well.

        expense_ref.update({
            u'name': name,
            u'category': category,
            u'date': startDate,
            u'actualAmount': amount,
            u'description': description,
            u'expectedAmount': predicted,
            u'recurPeriod': recurPeriod,
            u'recurring': recurring
        })
    else:
        raise RuntimeError("Verification failed, update canceled.")

def updateEarning(email, id, name, startDate, amount=0, description="", predicted=0, recurPeriod="One Time", recurring=False):
    earningList = getUser(email)['data']['expenses']

    # Check to make sure that the id passed in corresponds to an item in the user's database
    if id in earningList:
        expense_ref = db.collection(u'expenses').document(id)
        expense_ref.update({
            u'name': name,
            u'date': startDate,
            u'actualAmount': amount,
            u'description': description,
            u'expectedAmount': predicted,
            u'recurPeriod': recurPeriod,
            u'recurring': recurring
        })
    else:
        raise RuntimeError("Verification failed, update canceled.")

####################
# Delete functions #
####################
   
def deleteUser(email):
    pass
    # This function must:
    # - Delete all budgets, expenses, and earnings associated with the user
    # - TODO: When goals are added, make sure to delete those as well
    # - Delete user entry from database after all their budgets etc. are gone.

def deleteBudget(email, id):
    pass

def emergencyDeleteBudget(id):
    # Called when a budget is created, but does not successfully get attached to a user
    # This will prevent budgets without users from getting created.
    db.collection(u'budgets').document(id).delete()

def deleteExpense(email, id):
    pass

def emergencyDeleteExpense(id):
    # Called when an expense is created, but does not successfully get attached to a user
    # This will prevent expenses without users from getting created.
    db.collection(u'expenses').document(id).delete()

def deleteEarning(email, id):
    pass

def emergencyDeleteEarning(id):
    # Called when an expense is created, but does not successfully get attached to a user
    # This will prevent expenses without users from getting created.
    db.collection(u'earnings').document(id).delete()