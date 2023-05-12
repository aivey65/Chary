import firebase_admin
from firebase_admin import firestore
from flask import jsonify
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta

# Application Default credentials are automatically created.
app = firebase_admin.initialize_app()
db = firestore.client()

PERIODS = ["Daily", "Weekly", "Biweekly", "Monthly", "Yearly"]
__SUCCESS = True
__FAIL = False

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

def createBudget(email, name, startDate, endDate="", amount=0, description="", predicted=0, recurring=True, budgetPeriod=3):
    # Budget names need to be unique
    currentBudgets = getAllActiveBudgets(email)['categories']
    if name in currentBudgets:
        return __FAIL, ("You already have a budget with the name '" + name + "' currently in use!", "Try using a different name, or edit your existing budget.")
    
    newBudget = {
        u'email': email,
        u'name': name,
        u'startDate': startDate,
        u'endDate': endDate,
        u'actualBudgetAmount': amount,
        u'description': description,
        u'expectedBudgetAmount': predicted,
        u'recurring': recurring,
        u'budgetPeriod': budgetPeriod
    }



    create_datetime, budget_ref = db.collection(u'budgets').add(newBudget)

    # Add the newly created budgetId to the list of budgets in the user document
    try :
        updateUserReferenceIds(email, 0, 'budgets', budget_ref.id)
    except Exception as e:
        emergencyDeleteBudget(budget_ref.id)
        raise e
    
    return __SUCCESS, ('You have successfully added new budget: ' + name)


def createExpense(email, name, category, startDate, endDate="", amount=0, description="", predicted=0, recurPeriod=0, recurring=False):
    newExpense = {
        u'email': email,
        u'name': name,
        u'budgetCategory': category,
        u'startDate': startDate,
        u'endDate': endDate,
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
    
    # TODO: Update the user's wallet balance as well.


def createEarning(email, name, startDate, endDate="", amount=0, description="", predicted=0, recurPeriod=0, recurring=False):
    newEarning = {
        u'email': email,
        u'name': name,
        u'startDate': startDate,
        u'endDate': endDate,
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
def getTimeDelta(period):
    if period == 0:
        return timedelta(days=1)
    elif period == 1:
        return timedelta(weeks=1)
    elif period == 2:
        return timedelta(weeks=2)
    elif period == 3:
        return relativedelta(months=1)
    elif period == 4:
        return relativedelta(years=1)

def getSinglePeriod(startDate, period, includeDate, endDate=None):
    """
    Calculate the time period for a budget, earning, expense, etc. based on a target date
    Used when there is no end date yet, an item that is recurring or ongoing.

    Parameters
    ------------
    startDate: Date object
        This is a pyhton DateTime object for the start date of a given item
    period: string
        String representing the length of each time span
        - 0 (daily/one time, end date is one day after)
        - 1 (Weekly, end date is 7 days after) 
        - 2 (biweekly, end date is 14 days after)
        - 3 (monthly, end date is 1 calendar month after relative to start date i.e. not necessarily 28, 30, etc. days)
        - 4 (yearly, end date is 1 calendar year after realtive to start date i.e. not necessarily 365 days)
    includeDate: Date object
        This is the target date. The range must be able to include this date
    endDate: Date object
        This is the end date for the budget. In case the user sets an end date earlier than a
        full period, and that truncated period is the current one, it should end on the 
        end date provided by the user.

    Returns
    ----------
    newStartDate: startDate of the current period
    newEndDate: endDate of the current period
    """
    if (includeDate < startDate) or (endDate != None and includeDate > endDate):
        return None, None

    newStartDate = startDate
    newEndDate = startDate
    timeDelta = getTimeDelta(period)

    while includeDate > newEndDate:
        newStartDate = newEndDate
        newEndDate = newEndDate + timeDelta
    
    if (endDate != None and endDate < newEndDate):
        newEndDate = endDate

    return newStartDate, newEndDate

def getOccurancesWithinPeriod(startDate, endDate, targetStartDate, targetEndDate, targetPeriod):
    """
    Parameters
    -----------
    startDate: Date object
        Date represents the starting date for the time period we are searching
    endDate: Date object
        Date represents the last date for the time period we are searching
    targetStartDate: Date object
        The start date of the target entity to count occurances for
    targetEndDate: Date object
        The last possible date for target entity to have an occurance
    targetPeriod: string
        String representing the length of each time span
        - 0 (daily/one time, end date is one day after)
        - 1 (Weekly, end date is 7 days after) 
        - 2 (biweekly, end date is 14 days after)
        - 3 (monthly, end date is 1 calendar month after relative to start date i.e. not necessarily 28, 30, etc. days)
        - 4 (yearly, end date is 1 calendar year after realtive to start date i.e. not necessarily 365 days)
    
    Returns
    ---------
    occurances: int
        Number of times the target occurred in the specified period of time
    dates: list(Date objects)
        A list of all the dates the target occurred
    """
    occurances = 0
    occurranceDates = []
    timeDelta = getTimeDelta(targetPeriod)

    if (startDate == None) or (endDate == None):
        raise RuntimeError("Invalid time period provided.")

    if (targetEndDate != None and targetEndDate < startDate) or (targetStartDate > endDate): # The target is completely outside of the time period
        return occurances, occurranceDates

    # We only want to count occurances within our search dates 
    if targetEndDate == None or targetEndDate > endDate:
        targetEndDate = endDate
    
    newStartDate = targetStartDate
    while newStartDate < targetEndDate:
        if newStartDate < startDate: # We only want to count occurances within our search dates
            newStartDate = newStartDate + timeDelta
            continue
        else:
            occurances += 1
            occurranceDates.append(newStartDate)
            newStartDate = newStartDate + timeDelta

    return occurances, occurranceDates

# Get all data associated with a user (basic data, expenses, and budgets)
def getAll(email):
    user = getUser(email)['data']
    budgetsDict = {}
    expensesDict = {}
    budgetCategories = []

    for budgetID in user['budgets']:
        if budgetID == "":
            continue
        budgetDoc = db.collection(u'budgets').document(budgetID).get().to_dict()
        budgetDoc['usedAmount'] = getBudgetBalance(email, budgetID)
        budgetsDict[budgetID] = budgetDoc

        budgetCategories.append(budgetsDict[budgetID]['name'])
    
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

        budgetDoc = db.collection(u'budgets').document(budgetID).get().to_dict()
        budgetDoc['usedAmount'] = getBudgetBalance(email, budgetID)
        budgetsDict[budgetID] = budgetDoc

        budgetCategories.append(budgetsDict[budgetID]['name'])

    return {"data":budgetsDict, "categories":budgetCategories}

def getAllActiveBudgets(email, date=date.today()):
    """
    Gets all budgets active during a particular date
    
    """
    budgetList = getUser(email)['data']['budgets']
    budgetsDict = {}
    budgetCategories = []

    for budgetID in budgetList:
        if budgetID == "":
            continue

        budgetDoc = db.collection(u'budgets').document(budgetID).get().to_dict()
        budgetEnd = None if budgetDoc["endDate"] == "" else date.fromisoformat(budgetDoc["endDate"])
        budgetStart = date.fromisoformat(budgetDoc['startDate'])

        start, end = getSinglePeriod(
            budgetStart, 
            budgetDoc["budgetPeriod"],
            date,
            budgetEnd
        )

        if start != None and end != None:
            budgetsDict[budgetID] = budgetDoc
            budgetCategories.append(budgetDoc['name'])

    return {"data":budgetsDict, "categories":budgetCategories}

# Get a list of budget categories associated with a given user
def getBudgetCategories(email):
    user = getUser(email)['data']
    budgetList = user['budgets']
    budgetCategories = []

    for budgetID in budgetList:
        budget = db.collection(u'budgets').document(budgetID).get().to_dict()
        budgetCategories.append(budget["name"])

    return budgetCategories

def getBudgetBalance(email, id, targetDate=date.today()):
    """
    Parameters
    ------------
    email: string
        Email of the user requesting the budget
    id: string
        Id of the budget to get the balance for
    targetDate: Date object
        The target date to include in the current budget period
        (default) is today's date
    """
    userData = getUser(email)['data']
    budgetList = userData['budgets']

    # Make sure that the budget belongs to the user
    if (id not in budgetList):
        raise Exception("User does not have access to this information.")
    else:
        budgetDoc = db.collection(u'budgets').document(id).get().to_dict()
        
        # Get the active dates and period for the budget
        dbStart = date.fromisoformat(budgetDoc["startDate"])
        dbEnd = None if budgetDoc["endDate"] == "" else date.fromisoformat(budgetDoc["endDate"])

        # Getting the budget category and the start and end dates for just this current period.
        budgetCategory = budgetDoc["name"]
        startDate, endDate = getSinglePeriod(
            dbStart,
            budgetDoc["budgetPeriod"],
            targetDate, 
            dbEnd
        )

        # Check for valid start and end dates
        if (startDate == None or endDate == None):
            raise Exception("This budget was not active during this date.")

        # Run a query for expenses with the same email, budget category
        expenseList = db.collection(u'expenses')\
            .where(u'email', u'==', email)\
            .where(u'budgetCategory', u'==', budgetCategory)\
            .get()
        
        usedAmount = 0
        # Filter for expenses in the same budget period
        for expense in expenseList:
            expenseDoc = expense.to_dict()
            expenseEnd = None if expenseDoc["endDate"] == "" else date.fromisoformat(expenseDoc["endDate"])
            expenseStart = date.fromisoformat(expenseDoc['startDate'])

            occurances, dates = getOccurancesWithinPeriod(
                startDate, 
                endDate, 
                expenseStart, 
                expenseEnd, 
                expenseDoc['recurPeriod']
            )

            usedAmount = usedAmount + (int(expenseDoc['actualAmount']) * occurances)

        return usedAmount

# Get a user's expenses
# NOTE: This every raw expense from the database. It does not create duplicates for recurring expenses
def getAllExpenses(email):
    expenseList = db.collection(u'expenses')\
            .where(u'email', u'==', email)\
            .get()
    expensesDict = {}
    
    # Loop through the expenselist, making requests to the database
    for expense in expenseList:
        expenseDoc = expense.to_dict()
        expensesDict[expense.id] = expenseDoc

    # Get a list of budget categories
    budgetCategories = getBudgetCategories(email)

    return {"data":expensesDict, "categories":budgetCategories}

def getRecentExpenses(email, startDate, endDate):
    expenseList = db.collection(u'expenses')\
            .where(u'email', u'==', email)\
            .get()
    expensesDict = {}
    
    for expense in expenseList: 
        expenseDoc = expense.to_dict()

        expenseStart = date.fromisoformat(expenseDoc["startDate"])
        expenseEnd = None if expenseDoc["endDate"] == "" else date.fromisoformat(expenseDoc["endDate"])

        occurances, dates = getOccurancesWithinPeriod(
            startDate, 
            endDate, 
            expenseStart,
            expenseEnd,
            expenseDoc['recurPeriod']
        )

        if occurances > 0:
            expensesDict[expense.id] = {
                "data": expenseDoc,
                "dates": dates
            }

    # Get a list of budget categories
    budgetCategories = getBudgetCategories(email)

    return {"expenses":expensesDict, "categories":budgetCategories}

def getRecentEarnings(email, startDate, endDate):
    earningList = db.collection(u'earnings')\
            .where(u'email', u'==', email)\
            .get()
    earningsDict = {}
    
    for earning in earningList: 
        earningDoc = earning.to_dict()

        earningStart = date.fromisoformat(earningDoc["startDate"])
        earningEnd = date.fromisoformat(earningDoc["endDate"])

        occurances, dates = getOccurancesWithinPeriod(
            startDate, 
            endDate, 
            earningStart,
            earningEnd,
            earningDoc['recurPeriod']
        )

        if occurances > 0:
            earningsDict[earning.id] = {
                "data": earningDoc,
                "dates": dates
            }

    return earningsDict

def getExpense(expenseId, userEmail):
    if (expenseId == "" or userEmail == ""):
        print("No expense ID or email provided.")
        raise RuntimeError("No expense ID or email provided.")
    
    user = getUser(userEmail)['data']
    if (expenseId not in user['expenses']):
        print("User email does not match expense!")
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

def updateBudget(email, id, name, startDate, endDate="", amount=0, description="", predicted=0, recurPeriod="Monthly", recurring=True):
    budgetList = getUser(email)['data']['budgets']

    # Check to make sure that the id passed in corresponds to an item in the user's database
    if id in budgetList:
        budget_ref = db.collection(u'budgets').document(id)
        budget_ref.update({
            u'name': name,
            u'startDate': startDate,
            u'endDate': endDate,
            u'actualBudgetAmount': amount,
            u'description': description,
            u'expectedBudgetAmount': predicted,
            u'budgetPeriod': recurPeriod,
        })
        return __SUCCESS, ("Successfully updated budget!")
    else:
        raise RuntimeError("Verification failed, update canceled.")
    
    # TODO: If budget name is changed, first find expenses using the current budget name 
    # and make sure to change it to the new name.

def updateExpense(email, id, name, category, startDate, endDate="", amount=0, description="", predicted=0, recurPeriod="One Time", recurring=False):
    expenseList = getUser(email)['data']['expenses']

    print(id)
    print(category)
    print(amount)
    print(expenseList)
    print(startDate)
    # Check to make sure that the id passed in corresponds to an item in the user's database
    if id in expenseList:
        print("id verified")
        expense_ref = db.collection(u'expenses').document(id)
        expense_ref.update({
            u'name': name,
            u'budgetCategory': category,
            u'startDate': startDate,
            u'endDate': endDate,
            u'actualAmount': amount,
            u'description': description,
            u'expectedAmount': predicted,
            u'recurPeriod': recurPeriod,
            u'recurring': recurring
        })

        return __SUCCESS, ("Successfully updated expense!")
    else:
        raise RuntimeError("Verification failed, update canceled.")

def updateEarning(email, id, name, startDate, endDate="", amount=0, description="", predicted=0, recurPeriod="One Time", recurring=False):
    earningList = getUser(email)['data']['expenses']

    # Check to make sure that the id passed in corresponds to an item in the user's database
    if id in earningList:
        expense_ref = db.collection(u'expenses').document(id)
        expense_ref.update({
            u'name': name,
            u'startDate': startDate,
            u'endDate': endDate,
            u'actualAmount': amount,
            u'description': description,
            u'expectedAmount': predicted,
            u'recurPeriod': recurPeriod,
            u'recurring': recurring
        })

        return __SUCCESS, ("Successfully updated earning!")
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
        print("error1" + e)
        return

def deleteExpense(email, id):
    # First check to make sure the user owns the expense they want to delete
    expenseList = getUser(email)['data']['expenses']
    if id not in expenseList:
        raise RuntimeError("User does not have access to this data!")

    expense_ref = db.collection(u'expenses').document(id)
    category = expense_ref.get().to_dict()['budgetCategory']

    # Expenses must update the budget associated with them.

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