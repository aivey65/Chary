import calendar
import firebase_admin
from firebase_admin import firestore
from google.cloud.firestore_v1.base_query import FieldFilter, Or, And
from flask import jsonify
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta

# Application Default credentials are automatically created.
app = firebase_admin.initialize_app()
db = firestore.client()

PERIODS = ["Daily", "Weekly", "Biweekly", "Monthly", "Yearly"]

def notNull(variable):
    if (variable == None or variable == "" or variable == ''):
        return False
    else:
        return True
    
def getCurrentWeek(currentDate=date.today()):
    start = currentDate - timedelta(days=(currentDate.weekday() + 1) % 7)
    end = start + timedelta(days=6)

    return start, end

def getCurrentMonth(currentDate=date.today()):
    month = currentDate.month
    year = currentDate.year

    DOW, num_days = calendar.monthrange(year, month)
    
    return date(year, month, 1), date(year, month, num_days)

def getCurrentYear(currentDate=date.today()):
    year = currentDate.year

    return date(year, 1, 1), date(year, 12, 31)

####################
# Create functions #
####################
def createUser(email, username, image, color, currency, balance, tutorialFinished, profileCreation, password=None, google=True):
    newUser = {
        'email': str(email),
        'username': str(username),
        'profileImage': str(image),
        'profileColor': str(color),
        'currency': str(currency),
        'balance': float(balance),
        'tutorialFinished': bool(tutorialFinished),
        'profileCreation': bool(profileCreation),
        'budgets': [], 
        'earnings': [],
        'expenses': [],
        'joinDate': date.today().isoformat(),
        'password': str(password),
        'google': str(google)
    }
    
    # First check if there is already a user with that email.
    checkUser = db.collection('users').where(filter=FieldFilter('email', '==', email)).stream()
    if len(list(checkUser)) > 0:
        raise RuntimeError("There is already an account associated with this email! Try logging in.")
    else:
        db.collection('users').add(newUser)

def createBudget(email, name, startDate, endDate="", amount=0, description="", recurring=True, budgetPeriod=3):
    budget_ref = None
    try :
        # Make sure budget names are unique
        currentBudgets = getAllActiveBudgets(email)['categories']
        if name in currentBudgets:
            raise Exception("You already have a budget with the name '" + name + "' currently in use!", "Try using a different name, or edit your existing budget.")
        
        if (recurring==False):
            endDate = (date.fromisoformat(startDate) + getTimeDelta(int(budgetPeriod)) - timedelta(days=1))
            if (isinstance(endDate, date)):
                endDate = endDate.isoformat()

        newBudget = {
            'email': str(email),
            'name': str(name),
            'startDate': startDate,
            'endDate': endDate,
            'amount': float(amount),
            'description': str(description),
            'recurring': bool(recurring),
            'budgetPeriod': int(budgetPeriod)
        }

        # Add the new budget to the database
        create_datetime, budget_ref = db.collection('budgets').add(newBudget)
    except Exception as e:
        raise e
    
    try:
        # Add the newly created budgetId to the list of budgets in the user document
        updateUserReferenceIds(email, 0, 'budgets', budget_ref.id)
    except Exception as e:
        emergencyDeleteBudget(budget_ref.id)
        raise e

def createExpense(email, name, category, startDate, endDate="", amount=0, description="", recurPeriod=0, recurring=False):
    expense_ref = None
    try :
        if (recurring==False):
            endDate = (date.fromisoformat(startDate) + getTimeDelta(int(recurPeriod)) - timedelta(days=1))
            if (isinstance(endDate, date)):
                endDate = endDate.isoformat()

        newExpense = {
            'email': str(email),
            'name': str(name),
            'budgetCategory': str(category),
            'startDate': startDate,
            'endDate': endDate,
            'amount': float(amount),
            'description': str(description),
            'recurPeriod': int(recurPeriod),
            'recurring': bool(recurring)
        }

        create_datetime, expense_ref = db.collection('expenses').add(newExpense)
    except Exception as e:
        raise e
        
    try:
        # Add the newly created expenseID to the list of expenses in the user document
        updateUserReferenceIds(email, 0, 'expenses', expense_ref.id)
    except Exception as e:
        emergencyDeleteExpense(expense_ref.id)
        raise e
    
    
    # TODO: Update the user's wallet balance as well.


def createEarning(email, name, startDate, endDate="", amount=0, description="", recurPeriod=0, recurring=False):
    earning_ref = None
    try :
        if (recurring==False):
            endDate = (date.fromisoformat(startDate) + getTimeDelta(int(recurPeriod)) - timedelta(days=1))
            if (isinstance(endDate, date)):
                endDate = endDate.isoformat()

        newEarning = {
            'email': str(email),
            'name': str(name),
            'startDate': startDate,
            'endDate': endDate,
            'amount': float(amount),
            'description': str(description),
            'recurPeriod': int(recurPeriod),
            'recurring': bool(recurring)
        }

        create_datetime, earning_ref = db.collection('earnings').add(newEarning)
    except Exception as e:
        raise e
    
    try:
        # Add the newly created earningID to the list of earnings in the user document
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
        - 0 (daily, end date is one day after)
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

    timeDelta = getTimeDelta(period)
    newStartDate = startDate
    newEndDate = (startDate + timeDelta) - timedelta(days=1)
    
    while includeDate >= newEndDate:
        newStartDate = newEndDate + timedelta(days=1) # The day after the current end date.
        newEndDate = newEndDate + timeDelta
    
    if (endDate != None and endDate < newEndDate):
        newEndDate = endDate
    
    return newStartDate, newEndDate

def getOccurancesWithinPeriod(startDate, endDate, targetStartDate, targetEndDate, targetPeriod, recurring=True):
    """
    Parameters
    -----------
    startDate: Date object
        Date represents the starting date for the time period we are searching, inclusive
    endDate: Date object
        Date represents the day after the last date for the time period we are searching, i.e. exclusive
    targetStartDate: Date object
        The start date of the target entity to count occurances for
    targetEndDate: Date object
        The last possible date for target entity to have an occurance
    targetPeriod: string
        String representing the length of each time span
        - 0 (daily, end date is one day after)
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
    while newStartDate <= targetEndDate:
        if newStartDate < startDate: # We only want to count occurances within our search dates
            if not recurring: # If the item is not recurring and does not occur after the start date window.
                return occurances, occurranceDates
            else:
                newStartDate = newStartDate + timeDelta
                continue
        else:
            occurances += 1
            occurranceDates.append(newStartDate)
            newStartDate = newStartDate + timeDelta
    return occurances, occurranceDates

def getAllCurrent(email, period, targetDate):
    try:
        targetDate = date.fromisoformat(targetDate)
        startDate = None
        endDate = None

        if period == 0:
            startDate = targetDate
            endDate = targetDate
        elif period == 1 or period == 2:
            startDate, endDate = getCurrentWeek(targetDate)
        elif period == 3:
            startDate, endDate = getCurrentMonth(targetDate)
        elif period == 4:
            startDate, endDate = getCurrentYear(targetDate)
            print(startDate, endDate)

        user = getUser(email)['data']

        budgetData = getAllActiveBudgets(email)
        budgetsDict = budgetData["data"]
        budgetCategories = budgetData["categories"]

        RecentExpensesDict = getMostRecentExpenses(email)
        expenseDict = getExpensesInRange(email, startDate, endDate)
        earningDict = getEarningsInRange(email, startDate, endDate)

        user['budgets'] = budgetsDict
        user['expenses'] = {
            "recent": RecentExpensesDict,
            "all": expenseDict
        }
        user['earnings'] = earningDict
        user['budgetCategories'] = budgetCategories
        return {"data":user}
    except Exception as e:
        raise RuntimeError(str(e))
    
# Get a user's basic information, needed to get list of budgets, expenses, etc.
def getUser(email):
    # Note: Use of CollectionRef stream() is prefered to get()
    docs = db.collection('users').where(filter=FieldFilter('email', '==', email)).stream()

    for doc in docs: # Should only run once, since an email should only be present once in database
        userDict = doc.to_dict()
        # Update ISO format dates into date objects 
        userDict["joinDate"] = date.fromisoformat(userDict["joinDate"]) if notNull(userDict["joinDate"]) else None
        return {"data":userDict}

def getAllActiveBudgets(email, targetDate=date.today()):
    """
    Gets all budgets active during a particular date
    
    """
    budgetList = getUser(email)['data']['budgets']
    activeBudgetsDict = {}
    inactiveBudgetsDict = {}
    budgetCategories = []

    for budgetID in budgetList:
        if budgetID == "":
            continue

        budgetDoc = db.collection('budgets').document(budgetID).get().to_dict()
        try:
            budgetDoc["endDate"] = date.fromisoformat(budgetDoc["endDate"]) if notNull(budgetDoc["endDate"]) else None
            budgetDoc["startDate"] = date.fromisoformat(budgetDoc['startDate']) if notNull(budgetDoc['startDate']) else None

            start, end = getSinglePeriod(
                budgetDoc["startDate"], 
                budgetDoc["budgetPeriod"],
                targetDate,
                budgetDoc["endDate"]
            )

            if start != None and end != None:
                budgetDoc['usedAmount'] = getBudgetBalance(budgetID, budgetDoc, targetDate)
                activeBudgetsDict[budgetID] = budgetDoc
                
                budgetCategories.append(budgetDoc['name'])
            else:
                inactiveBudgetsDict[budgetID] = budgetDoc
        except Exception as e:
            raise RuntimeError(e)

    toReturn = {
        "data":{
            "active": activeBudgetsDict,
            "inactive": inactiveBudgetsDict
        }, 
        "categories":budgetCategories}
    return toReturn

# Get a list of budget categories associated with a given user
def getBudgetCategories(email):
    user = getUser(email)['data']
    budgetList = user['budgets']
    budgetCategories = []

    for budgetID in budgetList:
        budget = db.collection('budgets').document(budgetID).get().to_dict()
        budgetCategories.append(budget["name"])

    return budgetCategories

def getBudgetAndExpenses(email, id, targetDate=date.today()):
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
        try:
            budgetDoc = getBudget(id, email, targetDate)
            
            # "getBudget" already converts the budget's date from ISO format to Date object, so we do not need to change it here
            # Getting the budget category and the start and end dates for just this current period.
            budgetCategory = budgetDoc["name"]
            startDate, endDate = getSinglePeriod(
                budgetDoc["startDate"],
                budgetDoc["budgetPeriod"],
                targetDate, 
                budgetDoc["endDate"]
            )

            # Check for valid start and end dates
            if (startDate == None or endDate == None):
                raise RuntimeError("This budget was not active during this date.")

            # Run a query for expenses with the same email, budget category
            expenseList = db.collection('expenses')\
                .where(filter=FieldFilter('email', '==', email))\
                .where(filter=FieldFilter('budgetCategory', '==', budgetCategory))\
                .stream()
            
            returnList = []
            # Filter for expenses in the same budget period
            for expense in expenseList:
                expenseDoc = expense.to_dict()

                expenseDoc["endDate"] = date.fromisoformat(expenseDoc["endDate"]) if notNull(expenseDoc["endDate"]) else None
                expenseDoc["startDate"] = date.fromisoformat(expenseDoc['startDate']) if notNull(expenseDoc['startDate']) else None

                occurances, dates = getOccurancesWithinPeriod(
                    startDate, 
                    endDate, 
                    expenseDoc['startDate'], 
                    expenseDoc["endDate"], 
                    expenseDoc['recurPeriod']
                )

                if occurances > 0:
                    returnList.append({"data": expenseDoc, "dates": dates})
            return {"budget": budgetDoc, "expenses": returnList, "currency": userData["currency"]}
        
        except Exception as e:
            raise RuntimeError(e)

def getBudgetBalance(id, budgetDoc, targetDate=date.today()):
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
    email = budgetDoc['email']
    userData = getUser(email)['data']
    budgetList = userData['budgets']

    # Make sure that the budget belongs to the user
    if (id not in budgetList):
        raise Exception("User does not have access to this information.")
    else:
        try:
            # Get the active dates and period for the budget
            if not isinstance(budgetDoc["startDate"], date):
                budgetDoc["startDate"] = date.fromisoformat(budgetDoc["startDate"]) if notNull(budgetDoc["startDate"]) else None
            if not isinstance(budgetDoc["endDate"], date):
                budgetDoc["endDate"] = date.fromisoformat(budgetDoc["endDate"]) if notNull(budgetDoc["endDate"]) else None

            # Getting the budget category and the start and end dates for just this current period.
            budgetCategory = budgetDoc["name"]
            startDate, endDate = getSinglePeriod(
                budgetDoc["startDate"],
                budgetDoc["budgetPeriod"],
                targetDate, 
                budgetDoc["endDate"]
            )

            # Check for valid start and end dates
            if (startDate == None or endDate == None):
                raise Exception("This budget was not active during this date.")

            # Run a query for expenses with the same email, budget category
            expenseList = db.collection('expenses')\
                .where(filter=FieldFilter('email', '==', email))\
                .where(filter=FieldFilter('budgetCategory', '==', budgetCategory))\
                .stream()
            usedAmount = 0

            # Filter for expenses in the same budget period
            for expense in expenseList:
                expenseDoc = expense.to_dict()
                
                expenseDoc["endDate"] = date.fromisoformat(expenseDoc["endDate"]) if notNull(expenseDoc["endDate"]) else None
                expenseDoc['startDate'] = date.fromisoformat(expenseDoc['startDate']) if notNull(expenseDoc['startDate']) else None
                
                occurances, dates = getOccurancesWithinPeriod(
                    startDate, 
                    endDate, 
                    expenseDoc['startDate'], 
                    expenseDoc["endDate"], 
                    expenseDoc['recurPeriod']
                )
                
                usedAmount = usedAmount + (float(expenseDoc['amount']) * occurances)
                    
            return usedAmount

        except Exception as e:
            raise RuntimeError(e)

### Get subset ###
def getMostRecentExpenses(email, lim=10):
    """
    Create filters to get 10+ most recent expenses:
    - Recurring expenses AND no end date
    - Recurring expenses AND an end date greater than or equal to today's date
    - 10 most recent end dates less than or equal to today (We do not care about future events here)
    """

    # First filter to get 10 most recent
    filter_1 = FieldFilter("endDate", "<=", date.today().isoformat())

    # Second filter
    filter_recur = FieldFilter("recurring", "==", True)
    filter_2 = FieldFilter("endDate", "==", "")
    filter_3 = FieldFilter("endDate", ">=", date.today().isoformat())

    and_filter1 = And(filters=[filter_recur, filter_2])
    and_filter2 = And(filters=[filter_recur, filter_3])
    or_filter = Or(filters=[and_filter2, and_filter1])

    # Execute the filters    
    expenseList = list(db.collection('expenses')\
        .where(filter=FieldFilter('email', '==', email))\
        .where(filter=filter_1)\
        .limit(lim)\
        .stream())

    expenseList2 = db.collection('expenses')\
        .where(filter=FieldFilter('email', '==', email))\
        .where(filter=or_filter)\
        .stream()

    # Merge the filter results
    for expense in expenseList2:
        if expense not in expenseList:
            expenseList.append(expense)
    
    expensesDict = {}
    for expense in expenseList: 
        expenseDoc = expense.to_dict()

        expenseDoc["startDate"] = date.fromisoformat(expenseDoc["startDate"]) if notNull(expenseDoc["startDate"]) else None
        expenseDoc["endDate"] = date.fromisoformat(expenseDoc["endDate"]) if notNull(expenseDoc["endDate"]) else None
        
        endDate = min((i for i in [expenseDoc["endDate"], date.today()] if notNull(i)), default=None)
        startDate = max((i for i in [expenseDoc["startDate"], (endDate - (getTimeDelta(expenseDoc["recurPeriod"]) * lim))] if notNull(i)), default=None)

        occurances, dates = getOccurancesWithinPeriod(
            startDate, 
            endDate, 
            expenseDoc["startDate"],
            expenseDoc["endDate"],
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

def getExpensesInRange(email, startDate, endDate):
    # Include if 
    # - StartDate is less than or equal to the range end date
    # AND
    # - If endDate is null or greater than or equal to range start
    filter_1 = FieldFilter("startDate", "<=", endDate.isoformat()) 
    list1 = list(db.collection('expenses')\
        .where(filter=FieldFilter('email', '==', email))\
        .where(filter=filter_1)\
        .stream())

    filter_2A = FieldFilter("endDate", ">=", startDate.isoformat())
    filter_2B = FieldFilter("endDate", "==", "")
    filter_2 = Or(filters=[filter_2A, filter_2B])

    list2 = list(db.collection('expenses')\
        .where(filter=FieldFilter('email', '==', email))\
        .where(filter=filter_2)\
        .stream())
    
    expensesDict = {}
    # Create a list of values in both list1 and list2
    if (len(list1) < len(list2)):
        for expense in list1:
            if expense in list2:
                expenseDoc = expense.to_dict()

                expenseDoc["startDate"] = date.fromisoformat(expenseDoc["startDate"]) if notNull(expenseDoc["startDate"]) else None
                expenseDoc["endDate"] = date.fromisoformat(expenseDoc["endDate"]) if notNull(expenseDoc["endDate"]) else None

                occurances, dates = getOccurancesWithinPeriod(
                    startDate, 
                    endDate, 
                    expenseDoc["startDate"],
                    expenseDoc["endDate"],
                    expenseDoc['recurPeriod']
                )

                if occurances > 0:
                    expensesDict[expense.id] = {
                        "data": expenseDoc,
                        "dates": dates
                    }
    else:
        for expense in list2:
            if expense in list1:
                expenseDoc = expense.to_dict()

                expenseDoc["startDate"] = date.fromisoformat(expenseDoc["startDate"]) if notNull(expenseDoc["startDate"]) else None
                expenseDoc["endDate"] = date.fromisoformat(expenseDoc["endDate"]) if notNull(expenseDoc["endDate"]) else None

                occurances, dates = getOccurancesWithinPeriod(
                    startDate, 
                    endDate, 
                    expenseDoc["startDate"],
                    expenseDoc["endDate"],
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

def getEarningsInRange(email, startDate, endDate):
    filter_1 = FieldFilter("startDate", "<=", endDate.isoformat()) 
    list1 = list(db.collection('earnings')\
        .where(filter=FieldFilter('email', '==', email))\
        .where(filter=filter_1)\
        .stream())

    filter_2A = FieldFilter("endDate", ">=", startDate.isoformat())
    filter_2B = FieldFilter("endDate", "==", "")
    filter_2 = Or(filters=[filter_2A, filter_2B])

    list2 = list(db.collection('earnings')\
        .where(filter=FieldFilter('email', '==', email))\
        .where(filter=filter_2)\
        .stream())
    
    earningsDict = {}
    # Create a list of values in both list1 and list2
    if (len(list1) < len(list2)):
        for earning in list1:
            if earning in list2:
                earningDoc = earning.to_dict()

                earningDoc["startDate"] = date.fromisoformat(earningDoc["startDate"]) if notNull(earningDoc["startDate"]) else None
                earningDoc["endDate"] = date.fromisoformat(earningDoc["endDate"]) if notNull(earningDoc["endDate"]) else None

                occurances, dates = getOccurancesWithinPeriod(
                    startDate, 
                    endDate, 
                    earningDoc["startDate"],
                    earningDoc["endDate"],
                    earningDoc['recurPeriod']
                )

                if occurances > 0:
                    earningsDict[earning.id] = {
                        "data": earningDoc,
                        "dates": dates
                    }
    else:
        for earning in list2:
            if earning in list1:
                earningDoc = earning.to_dict()

                earningDoc["startDate"] = date.fromisoformat(earningDoc["startDate"]) if notNull(earningDoc["startDate"]) else None
                earningDoc["endDate"] = date.fromisoformat(earningDoc["endDate"]) if notNull(earningDoc["endDate"]) else None

                occurances, dates = getOccurancesWithinPeriod(
                    startDate, 
                    endDate, 
                    earningDoc["startDate"],
                    earningDoc["endDate"],
                    earningDoc['recurPeriod']
                )

                if occurances > 0:
                    earningsDict[earning.id] = {
                        "data": earningDoc,
                        "dates": dates
                    }

    return earningsDict

### Get individual items ###

def getExpense(expenseId, userEmail):
    if (expenseId == "" or userEmail == ""):
        raise RuntimeError("No expense ID or email provided.")
    
    user = getUser(userEmail)['data']
    if (expenseId not in user['expenses']):
        raise RuntimeError("User email does not match expense!")
    
    expenseDoc = db.collection('expenses').document(expenseId).get().to_dict()
    budgetCategories = getBudgetCategories(userEmail)

    # Update ISO format dates into date objects 
    expenseDoc["startDate"] = date.fromisoformat(expenseDoc["startDate"]) if notNull(expenseDoc["startDate"]) else None
    expenseDoc["endDate"] = date.fromisoformat(expenseDoc["endDate"]) if notNull(expenseDoc["endDate"]) else None

    return {"data":expenseDoc, "budgetCategories":budgetCategories}

def getBudget(budgetId, userEmail, targetDate=date.today()):
    if (budgetId == "" or userEmail == ""):
        raise RuntimeError("No budget ID or email provided.")
    
    user = getUser(userEmail)['data']
    if (budgetId not in user['budgets']):
        raise RuntimeError("User email does not match budget!")
    
    budgetDoc = db.collection('budgets').document(budgetId).get().to_dict()
    

    # Update ISO format dates into date objects 
    budgetDoc["startDate"] = date.fromisoformat(budgetDoc["startDate"]) if notNull(budgetDoc["startDate"]) else None
    budgetDoc["endDate"] = date.fromisoformat(budgetDoc["endDate"]) if notNull(budgetDoc["endDate"]) else None
    budgetDoc["usedAmount"] = getBudgetBalance(budgetId, budgetDoc, targetDate)

    return budgetDoc

def getEarning(earningId, userEmail):
    if (earningId == "" or userEmail == ""):
        raise RuntimeError("No earning ID or email provided.")
    
    user = getUser(userEmail)['data']
    if (earningId not in user['earnings']):
        raise RuntimeError("User email does not match earning!")
    
    earningDoc = db.collection('earnings').document(earningId).get().to_dict()

    # Update ISO format dates into date objects 
    earningDoc["startDate"] = date.fromisoformat(earningDoc["startDate"]) if notNull(earningDoc["startDate"]) else None
    earningDoc["endDate"] = date.fromisoformat(earningDoc["endDate"]) if notNull(earningDoc["endDate"]) else None

    return earningDoc

####################
# Setter functions #
####################
def updateUser(email, username, image, color, currency, balance):
    user = db.collection('users').where(filter=FieldFilter('email', '==', email)).stream()

    # Should only run once, since there should only be one user per email
    if len(list(user)) == 0:
        raise RuntimeError("Can't find user! Update failed.")
    elif len(list(user)) > 1:
        raise RuntimeError("Duplicate user found! Update failed.")
    else:
        user_ref = user[0]
        user_ref.update({
            'username': str(username),
            'profileImage': str(image),
            'profileColor': str(color),
            'currency': str(currency),
            'balance': float(balance)
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
        user = list(db.collection('users').where(filter=FieldFilter('email', '==', email)).stream())

        # Should only run once, since there should only be one user per email
        if len(user) == 0:
            raise RuntimeError("Can't find user! Update failed.")
        elif len(user) > 1:
            raise RuntimeError("Duplicate user found! Update failed.")
        else:
            user_ref = db.collection('users').document(user[0].id)

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

def updateBudget(email, id, name, startDate, endDate="", amount=0, description="", recurPeriod=3, recurring=True):
    budgetList = getUser(email)['data']['budgets']

    # Check to make sure that the id passed in corresponds to an item in the user's database
    if id in budgetList:
        try:
            if (recurring==False):
                endDate = (date.fromisoformat(startDate) + getTimeDelta(int(recurPeriod)) - timedelta(days=1))
                if (isinstance(endDate, date)):
                    endDate = endDate.isoformat()

            budget_ref = db.collection('budgets').document(id)
            budget_ref.update({
                'name': str(name),
                'startDate': str(startDate),
                'endDate': str(endDate),
                'amount': float(amount),
                'description': str(description),
                'budgetPeriod': int(recurPeriod),
                'recurring': bool(recurring)
            })
        except Exception as e:
            raise RuntimeError(e)
    else:
        raise RuntimeError("Verification failed, update canceled.")
    
    # TODO: If budget name is changed, first find expenses using the current budget name 
    # and make sure to change it to the new name.

def updateExpense(email, id, name, category, startDate, endDate="", amount=0, description="", recurPeriod=0, recurring=False):
    expenseList = getUser(email)['data']['expenses']

    # Check to make sure that the id passed in corresponds to an item in the user's database
    if id in expenseList:
        try:
            if (recurring==False):
                endDate = (date.fromisoformat(startDate) + getTimeDelta(int(recurPeriod)) - timedelta(days=1))
                if (isinstance(endDate, date)):
                    endDate = endDate.isoformat()

            expense_ref = db.collection('expenses').document(id)
            expense_ref.update({
                'name': str(name),
                'budgetCategory': str(category),
                'startDate': startDate,
                'endDate': endDate,
                'amount': float(amount),
                'description': str(description),
                'recurPeriod': int(recurPeriod),
                'recurring': bool(recurring)
            })
        except Exception as e:
            raise RuntimeError(e)
    else:
        raise RuntimeError("Verification failed, update canceled.")

def updateEarning(email, id, name, startDate, endDate="", amount=0, description="", recurPeriod=0, recurring=False):
    earningList = getUser(email)['data']['earnings']

    # Check to make sure that the id passed in corresponds to an item in the user's database
    if id in earningList:
        try:
            if (recurring==False):
                endDate = (date.fromisoformat(startDate) + getTimeDelta(int(recurPeriod)) - timedelta(days=1))
                if (isinstance(endDate, date)):
                    endDate = endDate.isoformat()

            earning_ref = db.collection('earnings').document(id)
            earning_ref.update({
                'name': str(name),
                'startDate': startDate,
                'endDate': endDate,
                'amount': float(amount),
                'description': str(description),
                'recurPeriod': int(recurPeriod),
                'recurring': bool(recurring)
            })
        except Exception as e:
            raise RuntimeError(e)
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
        db.collection('budgets').document(budget).delete()

    for expense in expenseList:
        db.collection('expenses').document(expense).delete()

    for earning in earningList:
        db.collection('earnings').document(earning).delete()

    db.collection('users').document(id).delete()

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
        budget_ref = db.collection('budgets').document(id)
        budgetDoc = budget_ref.get().to_dict()
        budgetName = budgetDoc["name"]

        # Let user choose what to do with expenses associated with the budget they want to delete
        # - Delete all expenses
        # - Migrate all expenses to a specified budget
        # - Make all expenses budgetless
        # - (Post-MVP) Allow users to manually selct/deselect expenses and migrate in bulk
        expenseList = userData['expenses']

        for expense in expenseList:
            expense_ref = db.collection('expenses').document(expense)
            expenseDoc = expense_ref.get().to_dict()

            if (expenseDoc["budgetCategory"] == budgetName):
                expense_ref.update({"budgetCategory": ""})

        budget_ref.delete() 
        updateUserReferenceIds(email, 1, 'budgets', id)
    except Exception as e:
        raise RuntimeError(e)

def deleteExpense(email, id):
    # First check to make sure the user owns the expense they want to delete
    expenseList = getUser(email)['data']['expenses']
    if id not in expenseList:
        raise RuntimeError("User does not have access to this data!")
    
    try:
        expense_ref = db.collection('expenses').document(id)
        expense_ref.delete()
        updateUserReferenceIds(email, 1, 'expenses', id)
    except Exception as e:
        raise e

def deleteEarning(email, id):
    # First check to make sure the user owns the expense they want to delete
    earningList = getUser(email)['data']['earnings']
    if id not in earningList:
        raise RuntimeError("User does not have access to this data!")
    
    try:
        earning_ref = db.collection('earnings').document(id)
        earning_ref.delete()
        updateUserReferenceIds(email, 1, 'earnings', id)
    except Exception as e:
        raise e


#####################################
# Emergency Delete Functions        #
# --------------------------------- #
# Only for back end use in the case #
# that a user does not exist        #
#####################################
def emergencyDeleteUser(id):
    db.collection('users').document(id).delete()

def emergencyDeleteBudget(id):
    # Called when a budget is created, but does not successfully get attached to a user
    # This will prevent budgets without users from getting created.
    db.collection('budgets').document(id).delete()

def emergencyDeleteExpense(id):
    # Called when an expense is created, but does not successfully get attached to a user
    # This will prevent expenses without users from getting created.
    db.collection('expenses').document(id).delete()

def emergencyDeleteEarning(id):
    # Called when an expense is created, but does not successfully get attached to a user
    # This will prevent expenses without users from getting created.
    db.collection('earnings').document(id).delete()