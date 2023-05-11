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
def createUser(email, username, image, color, currency, balance, password=None, google=True):
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
        u'joinDate': date.today(),
        u'password': password,
        u'google': google
    }
    
    # First check if there is already a user with that email.
    checkUser = db.collection(u'users').where(u'email', u'==', email).stream()
    if (checkUser.length > 0):
        raise RuntimeError("There is already an account associated with this email! Try logging in.")
    else:
        db.collection(u'users').add(newUser)

def createBudget(email, name, startDate, amount=0, description="", predicted=0, recurPeriod="Monthly"):
    newBudget = {
        u'email': email,
        u'name': name,
        u'date': startDate,
        u'actualBudgetAmount': amount,
        u'description': description,
        u'expectedBudgetAmount': predicted,
        u'budgetPeriod': recurPeriod
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
    budget_ref = db.collection(u'budgets').where(u'email', u'==', email).where(u'name', u'==', category).stream()
    if budget_ref.length == 0:
        emergencyDeleteExpense(expense_ref.id)
        raise RuntimeError("Can't find requested budget! Create failed.")
    elif budget_ref.length > 1:
        emergencyDeleteExpense(expense_ref.id)
        raise RuntimeError("Duplicate budget found! Create failed.")
    else:
        updateBudgetBalance(email, budget_ref.id, amount)
    
    # TODO: Update the user's wallet balance as well.


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
    
    # TODO: Update the user's wallet balance.

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

def getBudgetBalance(email, id):
    userData = getUser(email)['data']
    budgetList = userData['budgets']

    # Make sure that the budget belongs to the user
    if (id not in budgetList):
        raise Exception("User does not have access to this information.")
    else:
        # Get the name of the budget and the dates active
        # Run a query for expenses with the same email, budget category, and dates
        usedAmount = 0
        for expense in expensesList:
            expenseDoc = db.collection(u'expenses').document(expense).get()
            usedAmount += expenseDoc.to_dict()['actualAmount']

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
    
    # TODO: If budget name is changed, first find expenses using the current budget name 
    # and make sure to change it to the new name.

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
    """
    This function:
    - Deletes all budgets, expenses, and earnings associated with the user
    - TODO: When goals are added, make sure to delete those as well
    - Deletes user entry from database after all their budgets etc. are gone.
    """
    userData = getUser(email)['data']
    expenseList = userData['expenses']
    budgetList = userData['budgets']
    earningList = userData['earnings']

    for budget in budgetList:
        db.collection(u'budgets').document(budget).delete()

    for expense in expenseList:
        db.collection(u'expenses').document(expense).delete()

    for earning in earningList:
        db.collection(u'earnings').document(earning).delete()

    db.collection(u'users').document(id).delete()

def deleteBudget(email, id, method=0, newBudget=None):
    """
    Parameters
    -------------
        email: string
            The email of the user that owns this budget
        id: string
            The db-generated ID for the budget being deleted
        method: int
            The method of handling expenses:
            0 - Make all expenses associated with the budget into 'budgetless' expenses
            1 - Migrate all expenses to a specified budget
            2 - Delete all expenses associated with this budget
    """
    # First check to make sure the user owns the budget they want to delete
    userData = getUser(email)['data']
    budgetList = userData['budgets']
    if id not in budgetList:
        raise RuntimeError("User does not have access to this data!")

    try:
        updateUserReferenceIds(email, 1, 'budgets', id)

        # Let user chose what to do with expenses associated with the budget they want to delete
        # - Delete all expenses
        # - Migrate all expenses to a specified budget
        # - Make all expenses budgetless
        # - (Post-MVP) Allow users to manually selct/deselect expenses and migrate in bulk
        expenseList = userData['expenses']

        for expense in expenseList:
            expense_ref = db.collection(u'expenses').document(expense)
            expense_ref.update({"budgetCategory": ""})

        db.collection(u'budgets').document(id).delete() 
    except Exception as e:
        print(e)
        return

def deleteExpense(email, id):
    # First check to make sure the user owns the expense they want to delete
    expenseList = getUser(email)['data']['expenses']
    if id not in expenseList:
        raise RuntimeError("User does not have access to this data!")

    expense_ref = db.collection(u'expenses').document(id)
    category = expense_ref.get().to_dict()['budgetCategory']

    # Expenses must first update the budget associated with them.
    budget_ref = db.collection(u'budgets').where(u'email', u'==', email).where(u'name', u'==', category).stream()

    if budget_ref.length > 1:
        raise RuntimeError("Duplicate budget found! Delete failed.")
    elif budget_ref.length == 1:
        expense_ref = db.collection(u'expenses').document(id).get()
        expenseAmount = expense_ref.to_dict()['amount']

        updateBudgetBalance(email, budget_ref.id, -1 * expenseAmount)

    expense_ref.delete()

def deleteEarning(email, id):
    # First check to make sure the user owns the expense they want to delete
    earningList = getUser(email)['data']['earnings']
    if id not in earningList:
        raise RuntimeError("User does not have access to this data!")

    expense_ref = db.collection(u'expenses').document(id)
    # TODO: Update user wallet balance when an earning is deleted
    expense_ref.delete()


#####################################
# Emergency Delete Functions        #
# --------------------------------- #
# Only for back end use in the case #
# that a user does not exist        #
#####################################
def emergencyDeleteUser(id):
    db.collection(u'users').document(id).delete()

def emergencyDeleteBudget(id):
    # Called when a budget is created, but does not successfully get attached to a user
    # This will prevent budgets without users from getting created.
    db.collection(u'budgets').document(id).delete()

def emergencyDeleteExpense(id):
    # Called when an expense is created, but does not successfully get attached to a user
    # This will prevent expenses without users from getting created.
    db.collection(u'expenses').document(id).delete()

def emergencyDeleteEarning(id):
    # Called when an expense is created, but does not successfully get attached to a user
    # This will prevent expenses without users from getting created.
    db.collection(u'earnings').document(id).delete()