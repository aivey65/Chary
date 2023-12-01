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
    
def getOneWeek(currentDate=date.today()):
    start = currentDate - timedelta(days=6)

    return start, currentDate
    
def getCurrentWeek(currentDate=date.today()):
    start = currentDate - timedelta(days=((currentDate.weekday() + 1) % 7))
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

def getCurrentStartEnd(currentDate, period):
    compDate = date.fromisoformat(currentDate)

    if (period == None or period == 0):
        return currentDate, currentDate
    elif (period == 1 or period == 2): # Weekly or biweekly
        start, end = getCurrentWeek(compDate)
        return date.isoformat(start), date.isoformat(end)
    elif (period == 3):
        start, end = getCurrentMonth(compDate)
        return date.isoformat(start), date.isoformat(end)
    elif (period == 4):
        start, end = getCurrentYear(compDate)
        return date.isoformat(start), date.isoformat(end)
    else:
        return None, None
    
def getFullExpenseDates(targetDate, period):
    """
    Parameters
    -----------
    targetDate: Date object
        Date represents the target date to include in the start and end dates
    period: int
        [0, 1, 2, 3, 4] corresponding to the recurring period of the expense

    """
    if (not isinstance(targetDate, date)):
        targetDate = date.fromisoformat(targetDate)

    if (period == None or period == 0): # Daily, get full week
        start, end = getOneWeek(targetDate)
        return start, end
    elif (period == 1 or period == 2): # Weekly or biweekly, get 4 weeks
        start, end = getCurrentWeek(targetDate)
        start = start - timedelta(weeks=4)
        return start, end
    elif (period == 3): # Monthly, get full year
        start, end = getCurrentYear(targetDate)
        return start, end
    elif (period == 4): # Yearly, get past 4 years
        start, end = getCurrentYear(targetDate)
        start = start - relativedelta(years=4)
        return start, end
    else:
        return None, None 

def calculateNextDate(start, period):
    timeDelta = getTimeDelta(period)
    compStart = date.fromisoformat(start)
    compEnd = compStart + timeDelta

    return date.isoformat(compEnd)

def calculatePreviousDate(start, period):
    timeDelta = getTimeDelta(period)
    compStart = date.fromisoformat(start)
    compEnd = compStart - timeDelta

    return date.isoformat(compEnd)

####################
# Create functions #
####################
def createUser(email, username, password, salt, image, color, currency, tutorialFinished, profileCreation, google):
    newUser = {
        'email': str(email),
        'username': str(username),
        'password': str(password),
        'salt': str(salt),
        'profileImage': "undraw_blank",
        'profileColor': str(color),
        'currency': str(currency),
        'tutorialFinished': bool(tutorialFinished),
        'profileCreation': bool(profileCreation),
        'budgets': [], 
        'earnings': [],
        'expenses': [],
        'goals': [],
        'joinDate': date.today().isoformat(),
        'google': bool(google)
    }
    
    # First check if there is already a user with that email.
    checkUser = db.collection('users').where(filter=FieldFilter('email', '==', email)).stream()
    if len(list(checkUser)) > 0:
        raise RuntimeError("There is already an account associated with this email! Try logging in.")
    else:
        db.collection('users').add(newUser)

def createBudget(email, name, startDate, endDate="", amount=0, description="", recurring=True, budgetPeriod=3, original=None):
    try :
        # Make sure budget names are unique
        currentBudgets = getAllActiveBudgets(email, budgetPeriod, startDate)['categories']
        if name in currentBudgets:
            raise Exception("You already have a budget with the name '" + name + "' in use during the selected time!", "Try using a different name, or edit your existing budget.")
        
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
            'budgetPeriod': int(budgetPeriod),
            'original': str(original)
        }

        # Add the new budget to the database
        create_datetime, budget_ref = db.collection('budgets').add(newBudget)

        if original == None:
            budget_ref.update({
                'original': str(budget_ref.id)
            })
    except Exception as e:
        raise e

def createExpense(email, name, category, startDate, endDate="", amount=0, description="", recurPeriod=0, recurring=False, original=None):
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
            'recurring': bool(recurring),
            'original': str(original)
        }

        create_datetime, expense_ref = db.collection('expenses').add(newExpense)

        if original == None:
            expense_ref.update({
                'original': str(expense_ref.id)
            })
    except Exception as e:
        raise e

def createEarning(email, name, startDate, endDate="", amount=0, description="", recurPeriod=0, recurring=False, original=None):
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
            'recurring': bool(recurring),
            'original': str(original)
        }

        create_datetime, earning_ref = db.collection('earnings').add(newEarning)

        if original == None:
            earning_ref.update({
                'original': str(earning_ref.id)
            })
    except Exception as e:
        raise e
    
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
    while includeDate > newStartDate and includeDate > newEndDate:
        newStartDate = newEndDate + timedelta(days=1) # The day after the current end date.
        newEndDate = (newStartDate + timeDelta) - timedelta(days=1)
        
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
        Date represents the last day for the time period, inclusive
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

def getAllCurrent(email, period, targetDate, getFullChartData = False):
    try:
        if not getFullChartData:    
            startDate, endDate = getDatesFromPeriod(period, targetDate)
            user = getUser(email)['data']

            budgetData = getAllActiveBudgets(email, -2)
            budgetsDict = budgetData["data"]
            budgetCategories = budgetData["categories"]

            expenseDict = getExpensesInRange(email, startDate, endDate)
            earningDict = getEarningsInRange(email, startDate, endDate)

            user['budgets'] = budgetsDict
            user['expenses'] = expenseDict
            user['earnings'] = earningDict
            user['budgetCategories'] = budgetCategories
            return {"data":user}
        else:
            startDate, endDate = getDatesFromPeriod(period, targetDate)
            budgetData = getAllActiveBudgets(email, period, targetDate)

            fullStart, fullEnd = getFullExpenseDates(targetDate, period)
            expenseDict = getExpensesInRange(email, fullStart, fullEnd)
            earningDict = getEarningsInRange(email, fullStart, fullEnd)

            return {  "budgets": budgetData["data"], "expenses": expenseDict, "earnings": earningDict  }
    except Exception as e:
        raise RuntimeError(str(e))
    
# Get a user's basic information, needed to get list of budgets, expenses, etc.
def getUser(email):
    try:
        # Note: Use of CollectionRef stream() is prefered to get()
        docs = db.collection('users').where(filter=FieldFilter('email', '==', email)).stream()

        for doc in docs: # Should only run once, since an email should only be present once in database
            userDict = doc.to_dict()
            # Update ISO format dates into date objects 
            userDict["joinDate"] = date.fromisoformat(userDict["joinDate"]) if notNull(userDict["joinDate"]) else None
            userDict["id"] = doc.id
            return {"data":userDict}
    except Exception as e:
        raise RuntimeError(str(e))

def getAllActiveBudgets(email, period=3, targetDate=date.today()):
    """
    Gets all budgets active during a particular date
    
    """
    budgets_list = None
    budgetsDict = {}
    budgetCategories = []

    if (isinstance(targetDate, str)):
        targetDate = date.fromisoformat(targetDate)

    if period == -1 or period == -2:
        budgets_list = db.collection('budgets')\
            .where(filter=FieldFilter('email', '==', email))\
            .stream()
    else:
        budgets_list = db.collection('budgets')\
            .where(filter=FieldFilter('email', '==', email))\
            .where(filter=FieldFilter('budgetPeriod', '==', period))\
            .stream()

    for budget in budgets_list:
        budgetDoc = budget.to_dict()
        budgetID = budget.id

        try:
            budgetDoc["endDate"] = date.fromisoformat(budgetDoc["endDate"]) if notNull(budgetDoc["endDate"]) else None
            budgetDoc["startDate"] = date.fromisoformat(budgetDoc['startDate']) if notNull(budgetDoc['startDate']) else None

            start, end = getSinglePeriod(
                budgetDoc["startDate"], 
                budgetDoc["budgetPeriod"],
                targetDate,
                budgetDoc["endDate"]
            )

            if start == None and end == None:
                if period == -1: # 'Inactive' period
                    budgetDoc['usedAmount'] = 0
                    budgetDoc['totalUsedAmount'] = 0
                    budgetsDict[budgetID] = budgetDoc
            elif start != None and end != None and period != -1:
                currentAmount, totalAmount = getBudgetBalance(budgetID, budgetDoc, targetDate)
                budgetDoc['usedAmount'] = currentAmount
                budgetDoc['totalUsedAmount'] = totalAmount
                budgetsDict[budgetID] = budgetDoc
            
            budgetCategories.append(budgetDoc['name'])

        except Exception as e:
            raise RuntimeError(e)

    toReturn = {
        "data": budgetsDict,
        "categories":budgetCategories}
    return toReturn

# Get a list of budget categories associated with a given user
def getBudgetCategories(email):
    budgetList = db.collection('budgets').where(filter=FieldFilter('email', '==', email)).stream()
    budgetCategories = []

    for budget in budgetList:
        budgetDoc = budget.to_dict()
        budgetCategories.append(budgetDoc["name"])

    return budgetCategories

def getBudgetAndExpenses(email, id, targetDate=date.today(), getFullExpenseData=False):
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
    try:
        if (not isinstance(targetDate, date)):
            targetDate = date.fromisoformat(targetDate)
    
        userData = getUser(email)['data']
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
            return {"budget": budgetDoc, "expenses": [], "fullExpenses": [], "currency": userData["currency"]}

        # Run a query for expenses with the same email, budget category
        expenseList = db.collection('expenses')\
            .where(filter=FieldFilter('email', '==', email))\
            .where(filter=FieldFilter('budgetCategory', '==', budgetCategory))\
            .stream()
        
        expenseDict = {}
        fullExpenseDict = {}
        # Filter for expenses in the same budget period
        for expense in expenseList:
            expenseDoc = expense.to_dict()

            expenseDoc["endDate"] = date.fromisoformat(expenseDoc["endDate"]) if notNull(expenseDoc["endDate"]) else None
            expenseDoc["startDate"] = date.fromisoformat(expenseDoc['startDate']) if notNull(expenseDoc['startDate']) else None

            # If we need to get chart data for the whole year, we will populate another dictionary
            if (getFullExpenseData):
                fullStart, fullEnd = getFullExpenseDates(targetDate, budgetDoc["budgetPeriod"])
                fullOccurances, fullDates = getOccurancesWithinPeriod(
                    fullStart, 
                    fullEnd, 
                    expenseDoc['startDate'], 
                    expenseDoc['endDate'], 
                    expenseDoc['recurPeriod']
                )

                if fullOccurances > 0:
                    passedDates = []
                    upcomingDates = []
                    for singleDate in fullDates:                    
                        if singleDate <= date.today():
                            passedDates.append(singleDate)
                        else:
                            upcomingDates.append(singleDate)

                    fullExpenseDict[expense.id] = {
                        "data": expenseDoc,
                        "passedDates": passedDates,
                        "upcomingDates":upcomingDates,
                        "allDates": fullDates
                    }

            occurances, dates = getOccurancesWithinPeriod(
                startDate, 
                endDate, 
                expenseDoc['startDate'], 
                expenseDoc['endDate'], 
                expenseDoc['recurPeriod']
            )

            if occurances > 0:
                passedDates = []
                upcomingDates = []
                for singleDate in dates:                    
                    if singleDate <= date.today():
                        passedDates.append(singleDate)
                    else:
                        upcomingDates.append(singleDate)

                expenseDict[expense.id] = {
                    "data": expenseDoc,
                    "passedDates": passedDates,
                    "upcomingDates":upcomingDates,
                    "allDates": dates
                }

        return { "budget": budgetDoc, "expenses": expenseDict, "fullExpenses": fullExpenseDict, "currency": userData["currency"] }
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

    Returns
    -------------
    currentAmount: int
        The amount spent in a budget up to today's date
    totalAmount: int
        The amount spent in a budget including upcoming expenses that have not happened yet
    """
    try:
        checkBudget = db.collection('budgets').document(id).get().to_dict()
        email = budgetDoc["email"]

        if (checkBudget["email"] != email):
            raise RuntimeError("Information does not match what is in the database!")
        
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
            return 0, 0

        # Run a query for expenses with the same email, budget category
        expenseList = db.collection('expenses')\
            .where(filter=FieldFilter('email', '==', email))\
            .where(filter=FieldFilter('budgetCategory', '==', budgetCategory))\
            .stream()
        
        currentAmount = 0
        totalAmount = 0

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
            
            currentValue = float(expenseDoc['amount'])
            totalAmount = totalAmount + (currentValue * occurances)

            todayDate = date.today()
            for singleDate in dates:
                if singleDate <= todayDate:
                    currentAmount = currentAmount + currentValue
                
        return currentAmount, totalAmount
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
            passedDates = []
            upcomingDates = []
            for singleDate in dates:
                if singleDate <= date.today():
                    passedDates.append(singleDate)
                else:
                    upcomingDates.append(singleDate)

            expensesDict[expense.id] = {
                "data": expenseDoc,
                "passedDates": passedDates,
                "upcomingDates":upcomingDates,
                "allDates": dates
            }

    # Get a list of budget categories
    budgetCategories = getBudgetCategories(email)
    return {"expenses":expensesDict, "categories":budgetCategories}

def getDatesFromPeriod(period, targetDate):
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

        return startDate, endDate
    except Exception as e:
        raise RuntimeError(e)

def getExpensesInRange(email, startDate, endDate, currentDate=date.today()):
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
                    passedDates = []
                    upcomingDates = []
                    for singleDate in dates:
                        if singleDate <= currentDate:
                            passedDates.append(singleDate)
                        else:
                            upcomingDates.append(singleDate)

                    expensesDict[expense.id] = {
                        "data": expenseDoc,
                        "passedDates": passedDates,
                        "upcomingDates":upcomingDates,
                        "allDates": dates 
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
                    passedDates = []
                    upcomingDates = []
                    for singleDate in dates:
                        if singleDate <= currentDate:
                            passedDates.append(singleDate)
                        else:
                            upcomingDates.append(singleDate)

                    expensesDict[expense.id] = {
                        "data": expenseDoc,
                        "passedDates": passedDates,
                        "upcomingDates":upcomingDates,
                        "allDates": dates  
                    }

    # Get a list of budget categories
    budgetCategories = getBudgetCategories(email)

    return {"expenses":expensesDict, "categories":budgetCategories}

def getEarningsInRange(email, startDate, endDate, currentDate=date.today()):
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
                    passedDates = []
                    upcomingDates = []
                    for singleDate in dates:
                        if singleDate <= currentDate:
                            passedDates.append(singleDate)
                        else:
                            upcomingDates.append(singleDate)

                    earningsDict[earning.id] = {
                        "data": earningDoc,
                        "passedDates": passedDates,
                        "upcomingDates":upcomingDates,
                        "allDates": dates
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
                    passedDates = []
                    upcomingDates = []
                    for singleDate in dates:
                        if singleDate <= currentDate:
                            passedDates.append(singleDate)
                        else:
                            upcomingDates.append(singleDate)

                    earningsDict[earning.id] = {
                        "data": earningDoc,
                        "passedDates": passedDates,
                        "upcomingDates":upcomingDates,
                        "allDates": dates
                    }

    return earningsDict

### Get individual items ###

def getExpense(expenseId, userEmail):
    if (expenseId == "" or userEmail == ""):
        raise RuntimeError("No expense ID or email provided.")
    
    expenseDoc = db.collection('expenses').document(expenseId).get().to_dict()

    if (expenseDoc["email"] != userEmail):
        raise RuntimeError("User email does not match expense!")
    
    budgetCategories = getBudgetCategories(userEmail)

    # Update ISO format dates into date objects 
    expenseDoc["startDate"] = date.fromisoformat(expenseDoc["startDate"]) if notNull(expenseDoc["startDate"]) else None
    expenseDoc["endDate"] = date.fromisoformat(expenseDoc["endDate"]) if notNull(expenseDoc["endDate"]) else None

    return {"data":expenseDoc, "budgetCategories":budgetCategories}

def getBudget(budgetId, userEmail, targetDate=date.today()):
    if (budgetId == "" or userEmail == ""):
        raise RuntimeError("No budget ID or email provided.")
    
    budgetDoc = db.collection('budgets').document(budgetId).get().to_dict()

    if (budgetDoc["email"] != userEmail):
        raise RuntimeError("User email does not match budget!")

    # Update ISO format dates into date objects 
    budgetDoc["startDate"] = date.fromisoformat(budgetDoc["startDate"]) if notNull(budgetDoc["startDate"]) else None
    budgetDoc["endDate"] = date.fromisoformat(budgetDoc["endDate"]) if notNull(budgetDoc["endDate"]) else None

    currentAmount, totalAmount = getBudgetBalance(budgetId, budgetDoc, targetDate)
    budgetDoc["usedAmount"] = currentAmount
    budgetDoc["totalUsedAmount"] = totalAmount

    return budgetDoc

def getEarning(earningId, userEmail):
    if (earningId == "" or userEmail == ""):
        raise RuntimeError("No earning ID or email provided.")
    
    earningDoc = db.collection('earnings').document(earningId).get().to_dict()

    if (earningDoc["email"] != userEmail):
        raise RuntimeError("User email does not match earning!")
    
    # Update ISO format dates into date objects 
    earningDoc["startDate"] = date.fromisoformat(earningDoc["startDate"]) if notNull(earningDoc["startDate"]) else None
    earningDoc["endDate"] = date.fromisoformat(earningDoc["endDate"]) if notNull(earningDoc["endDate"]) else None

    return earningDoc

####################
# Setter functions #
####################
def updateUser(email, username, image, color, currency):
    user = list(db.collection('users').where(filter=FieldFilter('email', '==', email)).stream())

    # Should only run once, since there should only be one user per email
    if len(list(user)) == 0:
        raise RuntimeError("Can't find user! Update failed.")
    elif len(list(user)) > 1:
        raise RuntimeError("Duplicate user found! Update failed.")
    else:
        user[0].reference.update({
            'username': str(username),
            'profileImage': str(image),
            'profileColor': str(color),
            'currency': str(currency),
            'profileCreation': True
        })

def updateBudget(email, id, method, name, startDate, endDate="", currentDate=date.today(), amount=0, description="", recurPeriod=3, recurring=True):
    """
    When updating budgets, some things need to be kept consistant ALWAYS
        - Name
        - Recurring
        - RecurPeriod
    These need to be controlled based on update method, and changed to the new, user-provided one:
        - One
            startDate to currentDate - 1 day
            currentDate to currentDate + 1 period
            currentDate + 1 Period + 1 day to endDate
        - All
            startDate to endDate
        - Future
            startDate to currentDate - 1 day
            currentDate to endDate
    These values can change between instances:
        - amount
        - description
    """
    try:
        budget_ref = db.collection('budgets').document(id)
        budgetDoc = budget_ref.get().to_dict()

        if (budgetDoc["email"] != email):
            raise RuntimeError("Verification failed, update canceled.")
        
        if (recurring==False): # Calculate the end date for a budget that does not recur
            endDate = (date.fromisoformat(startDate) + getTimeDelta(int(recurPeriod)) - timedelta(days=1))
            if (isinstance(endDate, date)):
                endDate = endDate.isoformat()

        # Get the original values of this budget
        currentDate = date.fromisoformat(currentDate)
        oldName = budgetDoc["name"]
        oldEnd = budgetDoc["endDate"]
        oldAmount = budgetDoc["amount"]
        oldDesc = budgetDoc["description"]
        oldRecurring = budgetDoc["recurring"]
        oldOriginal = budgetDoc["original"]

        # If the name is changing, update expenses associated with this budget
        if (oldName != name):
            expenseList = db.collection('expenses')\
                .where(filter=FieldFilter('email', '==', email))\
                .where(filter=FieldFilter('budgetCategory', '==', oldName))\
                .stream()
            
            for expense in expenseList:
                expense.reference.update({
                    'budgetCategory': str(name)
                })

        # All budgets, regardless of dates, need to be updated. 
        budgetList = db.collection('budgets')\
            .where(filter=FieldFilter('email', '==', email))\
            .where(filter=FieldFilter('original', '==', oldOriginal))\
            .stream() 

        if (recurring == False or method == "all"): 
            budget_ref.update({
                'startDate': str(startDate),
                'endDate': str(endDate),
            })  

            for budget in budgetList:
                cur_budget_ref = budget.reference            

                if recurring == False and cur_budget_ref.id != oldOriginal:
                    cur_budget_ref.delete()
                else:
                    cur_budget_ref.update({
                        'name': str(name),
                        'amount': float(amount),
                        'description': str(description),
                        'budgetPeriod': int(recurPeriod),
                        'recurring': bool(recurring)
                    })
        elif (method == "one"):    
            # Create a new budget for the one changing instance
            newStart = currentDate.isoformat()
            newEnd = currentDate + getTimeDelta(int(recurPeriod)) - getTimeDelta(0)
            createBudget(email, name, newStart, newEnd.isoformat(), amount, description, recurring, recurPeriod, oldOriginal)

            # Create a new budget for the future instance, matching the past instance in everything but start/end dates
            futureStart = newEnd + getTimeDelta(0)
            createBudget(email, name, futureStart.isoformat(), oldEnd, oldAmount, oldDesc, oldRecurring, recurPeriod, oldOriginal)

            # Update original budget to have an end date right before the newStart date
            pastEnd = currentDate - getTimeDelta(0)
            budget_ref.update({
                'startDate': str(startDate),
                'endDate': str(pastEnd.isoformat()),
                'name': str(name),
                'budgetPeriod': int(recurPeriod),
            })

            # As for the other budgets, only the name and recur period need to be made the same.
            for budget in budgetList:
                cur_budget_ref = budget.reference
                
                cur_budget_ref.update({
                    'name': str(name),
                    'budgetPeriod': int(recurPeriod),
                })
        elif (method == "future"):
            # Create a new budget for the current/future instance
            newStart = currentDate.isoformat()
            createBudget(email, name, newStart, endDate, amount, description, recurring, recurPeriod, oldOriginal)

            # Update the original budget to have an end date right before the newStart date
            pastEnd = currentDate - getTimeDelta(0)
            budget_ref.update({
                'startDate': str(startDate),
                'endDate': str(pastEnd.isoformat()),
                'name': str(name),
                'budgetPeriod': int(recurPeriod),
            })

            # All Future budgets of different ids after the newStart date should be updated here
            for budget in budgetList:
                cur_budget_ref = budget.reference  
                curBudgetDoc = budget.to_dict()

                # Recur period needs to be kept the same 
                cur_budget_ref.update({
                    'budgetPeriod': int(recurPeriod),
                    'name': str(name),
                })

                if (curBudgetDoc["startDate"] >= newStart):        
                    cur_budget_ref.update({
                        'amount': float(amount),
                        'description': str(description),
                        'recurring': bool(recurring)
                    })
        else:
            raise RuntimeError("Invalid update method provided. Update canceled.")
    except Exception as e:
        raise RuntimeError(e)

def updateExpense(email, id, method, name, category, startDate, endDate="", currentDate=date.today(), amount=0, description="", recurPeriod=0, recurring=False):
    """
    When updating expenses, some things need to be kept consistant ALWAYS
        - recurring
        - recurPeriod
    These need to be controlled based on update method, and changed to the new, user-provided one:
        - One
            startDate to currentDate - 1 day
            currentDate to currentDate + 1 period
            currentDate + 1 Period + 1 day to endDate
        - All
            startDate to endDate
        - Future
            startDate to currentDate - 1 day
            currentDate to endDate
    These values can change between instances:
        - name
        - amount
        - description
        - budgetCategory
    """
    try:
        expense_ref = db.collection('expenses').document(id)
        expenseDoc = expense_ref.get().to_dict()

        if (expenseDoc["email"] != email):
            raise RuntimeError("Verification failed, update canceled.")

        if (recurring==False):
            endDate = (date.fromisoformat(startDate) + getTimeDelta(int(recurPeriod)) - timedelta(days=1))
            if (isinstance(endDate, date)):
                endDate = endDate.isoformat()
    
        currentDate = date.fromisoformat(currentDate)
        oldName = expenseDoc["name"]
        oldCategory = expenseDoc["budgetCategory"]
        oldAmount = expenseDoc["amount"]
        oldDesc = expenseDoc["description"]
        oldRecurring = expenseDoc["recurring"]
        oldOriginal = expenseDoc["original"]

        # Get all of the expenses with the same original
        expenseList = db.collection('expenses')\
            .where(filter=FieldFilter('email', '==', email))\
            .where(filter=FieldFilter('original', '==', oldOriginal))\
            .stream() 

        if (recurring == False or method == "all"):
            expense_ref.update({
                'startDate': str(startDate),
                'endDate': str(endDate),
            })  

            for expense in expenseList:
                cur_expense_ref = expense.reference            

                if recurring == False and cur_expense_ref.id != oldOriginal:
                    cur_expense_ref.delete()
                else:
                    cur_expense_ref.update({
                        'name': str(name),
                        'amount': float(amount),
                        'description': str(description),
                        'recurPeriod': int(recurPeriod),
                        'recurring': bool(recurring)
                    })
        elif (method == "one"):
            # Create a new expense for the one changing instance
            newStart = currentDate.isoformat()
            newEnd = currentDate + getTimeDelta(int(recurPeriod)) - getTimeDelta(0)

            createExpense(email, name, category, newStart, newEnd.isoformat(), amount, description, recurPeriod, recurring, oldOriginal)

            # Create a new expense for the future instance, matching the past instance in everything but start dates
            futureStart = newEnd + getTimeDelta(0)
            createExpense(email, oldName, oldCategory, futureStart.isoformat(), endDate, oldAmount, oldDesc, recurPeriod, oldRecurring, oldOriginal)

            # Update original expense to have an end date right before the newStart date
            pastEnd = currentDate - getTimeDelta(0)
            expense_ref.update({
                'startDate': str(startDate),
                'endDate': str(pastEnd.isoformat()),
                'recurPeriod': int(recurPeriod)
            })

            # Recur period needs to be kept the same 
            for expense in expenseList:
                cur_expense_ref = expense.reference            

                cur_expense_ref.update({
                    'recurPeriod': int(recurPeriod),
                })
        elif (method == "future"):
            # Create a new expense for the current/future instance
            newStart = currentDate.isoformat()
            createExpense(email, name, category, newStart, endDate, amount, description, recurPeriod, recurring, oldOriginal)

            # Update the original expense to have an end date right before the newStart date
            pastEnd = currentDate - getTimeDelta(0)
            expense_ref.update({
                'startDate': str(startDate),
                'endDate': str(pastEnd.isoformat()),
                'recurPeriod': int(recurPeriod)
            })

            # All Future expenses of different ids after the newStart date should be updated here
            for expense in expenseList:
                cur_expense_ref = expense.reference  
                curExpenseDoc = expense.to_dict()

                # Recur period needs to be kept the same 
                cur_expense_ref.update({
                    'recurPeriod': int(recurPeriod),
                })

                if (curExpenseDoc["startDate"] >= newStart):        
                    cur_expense_ref.update({
                        'name': str(name),
                        'amount': float(amount),
                        'description': str(description),
                        'recurring': bool(recurring)
                    })
    except Exception as e:
        raise RuntimeError(e)

def updateEarning(email, id, method, name, startDate, endDate="", currentDate=date.today(), amount=0, description="", recurPeriod=0, recurring=False):
    """
    When updating earnings, some things need to be kept consistant ALWAYS
        - recurring
        - recurPeriod
    These need to be controlled based on update method, and changed to the new, user-provided one:
        - One
            startDate to currentDate - 1 day
            currentDate to currentDate + 1 period
            currentDate + 1 Period + 1 day to endDate
        - All
            startDate to endDate
        - Future
            startDate to currentDate - 1 day
            currentDate to endDate
    These values can change between instances:
        - name
        - amount
        - description
    """
    try:
        earning_ref = db.collection('earnings').document(id)
        earningDoc = earning_ref.get().to_dict()

        if (earningDoc["email"] != email):
            raise RuntimeError("Verification failed, update canceled.")
        
        if (recurring==False):
            endDate = (date.fromisoformat(startDate) + getTimeDelta(int(recurPeriod)) - timedelta(days=1))
            if (isinstance(endDate, date)):
                endDate = endDate.isoformat()

        currentDate = date.fromisoformat(currentDate)
        oldName = earningDoc["name"]
        oldAmount = earningDoc["amount"]
        oldDesc = earningDoc["description"]
        oldRecurring = earningDoc["recurring"]
        oldOriginal = earningDoc["original"]

        # Get all of the earnings with the same original
        earningList = db.collection('earnings')\
            .where(filter=FieldFilter('email', '==', email))\
            .where(filter=FieldFilter('original', '==', oldOriginal))\
            .stream() 
        
        if (recurring == False or method == "all"):
            earning_ref.update({
                'startDate': str(startDate),
                'endDate': str(endDate),
            })  

            for earning in earningList:
                cur_earning_ref = earning.reference            

                if recurring == False and cur_earning_ref.id != oldOriginal:
                    cur_earning_ref.delete()
                else:
                    cur_earning_ref.update({
                        'name': str(name),
                        'amount': float(amount),
                        'description': str(description),
                        'recurPeriod': int(recurPeriod),
                        'recurring': bool(recurring)
                    })
        elif (method == "one"):
            # Create a new earning for the one changing instance
            newStart = currentDate.isoformat()
            newEnd = currentDate + getTimeDelta(int(recurPeriod)) - getTimeDelta(0)
            createEarning(email, name, newStart, newEnd.isoformat(), amount, description, recurPeriod, recurring, oldOriginal)

            # Create a new earning for the future instance, matching the past instance in everything but start dates
            futureStart = newEnd + getTimeDelta(0)
            createEarning(email, oldName, futureStart.isoformat(), endDate, oldAmount, oldDesc, recurPeriod, oldRecurring, oldOriginal)

            # Update original earning to have an end date right before the newStart date
            pastEnd = currentDate - getTimeDelta(0)
            earning_ref.update({
                'startDate': str(startDate),
                'endDate': str(pastEnd.isoformat()),
                'recurPeriod': int(recurPeriod)
            })

            # Recur period needs to be kept the same 
            for earning in earningList:
                cur_earning_ref = earning.reference            

                cur_earning_ref.update({
                    'recurPeriod': int(recurPeriod),
                })
        elif (method == "future"):
            # Create a new earning for the current/future instance
            newStart = currentDate.isoformat()
            createEarning(email, name, newStart, endDate, amount, description, recurPeriod, recurring, oldOriginal)

            # Update the original earning to have an end date right before the newStart date
            pastEnd = currentDate - getTimeDelta(0)
            earning_ref.update({
                'startDate': str(startDate),
                'endDate': str(pastEnd.isoformat()),
                'recurPeriod': int(recurPeriod)
            })

            # Recur period needs to be kept the same 
            for earning in earningList:
                cur_earning_ref = earning.reference  
                curEarningDoc = earning.to_dict()

                # Recur period needs to be kept the same 
                cur_earning_ref.update({
                    'recurPeriod': int(recurPeriod),
                })

                if (curEarningDoc["startDate"] >= newStart):        
                    cur_earning_ref.update({
                        'name': str(name),
                        'amount': float(amount),
                        'description': str(description),
                        'recurring': bool(recurring)
                    })
    except Exception as e:
        raise RuntimeError(e)

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
    budgetList = db.collection('budgets').where(filter=FieldFilter('email', '==', email)).stream()
    expenseList = db.collection('expenses').where(filter=FieldFilter('email', '==', email)).stream()
    earningList = db.collection('earnings').where(filter=FieldFilter('email', '==', email)).stream()
    for budget in budgetList:
        budget.reference.delete()

    for expense in expenseList:
        expense.reference.delete()

    for earning in earningList:
        earning.reference.delete()

    db.collection('users').document(userData['id']).delete()

def deleteBudget(email, id, method, currentDate=date.today()):
    """
    Delete the specified budget.

    Parameters
    -------------
        email: string
            The email of the user that owns this budget
        id: string
            The db-generated ID for the budget being deleted
        method: string
            "all", "one", or "future
    """
    try:
        budget_ref = db.collection('budgets').document(id)
        budgetDoc = budget_ref.get().to_dict()

        # First check to make sure the user owns the budget they want to delete
        if budgetDoc["email"] != email:
            raise RuntimeError("User does not have access to this data!")

        budgetName = budgetDoc["name"]
        recurPeriod = budgetDoc["budgetPeriod"]
        endDate = budgetDoc["endDate"]
        amount = budgetDoc["amount"]
        description = budgetDoc["description"]
        recurring = budgetDoc["recurring"]
        oldOriginal = budgetDoc["original"]

        if (recurring == False or method == "all"):
            budgetList = db.collection('budgets')\
                .where(filter=FieldFilter('email', '==', email))\
                .where(filter=FieldFilter('original', '==', oldOriginal))\
                .stream() 
            
            for budget in budgetList:
                cur_budget_ref = budget.reference

                cur_budget_ref.delete() 
        elif (method == "one"):
            # Update original budget to have an end date right before the excludeStart date
            pastEnd = currentDate - getTimeDelta(0)
            budget_ref.update({
                'endDate': str(pastEnd.isoformat()),
            })

            # Create a new budget for the future instance, matching the past instance in everything but start date
            futureStart = currentDate + getTimeDelta(int(recurPeriod))
            createBudget(email, budgetName, futureStart.isoformat(), endDate, amount, description, recurring, recurPeriod, oldOriginal)  
        elif (method == "future"):
            # Update original budget to have an end date right before the excludeStart date
            pastEnd = currentDate - getTimeDelta(0)
            budget_ref.update({
                'endDate': str(pastEnd.isoformat()),
            })
    except Exception as e:
        raise RuntimeError(e)

def deleteExpense(email, id, method, currentDate=date.today()):
    try:
        expense_ref = db.collection('expenses').document(id)
        expenseDoc = expense_ref.get().to_dict()

        # First check to make sure the user owns the expense they want to delete
        if expenseDoc["email"] != email:
            raise RuntimeError("User does not have access to this data!")
        
        if (not isinstance(currentDate, date)):
            currentDate = date.fromisoformat(currentDate)

        # Data from current budget in order to create new ones as needed
        name = expenseDoc["name"]
        budgetCategory = expenseDoc["budgetCategory"]
        recurPeriod = expenseDoc["recurPeriod"]
        endDate = expenseDoc["endDate"]
        amount = expenseDoc["amount"]
        description = expenseDoc["description"]
        recurring = expenseDoc["recurring"]
        oldOriginal = expenseDoc["original"]

        if (recurring == False or method == "all"):
            expenseList = db.collection('expenses')\
                .where(filter=FieldFilter('email', '==', email))\
                .where(filter=FieldFilter('original', '==', oldOriginal))\
                .where(filter=FieldFilter('name', '==', name))\
                .stream()  
            
            for expense in expenseList:
                cur_expense_ref = expense.reference

                cur_expense_ref.delete()  
        elif (method == "one"):
            # Update original expense to have an end date right before the excludeStart date
            pastEnd = currentDate - getTimeDelta(0)
            expense_ref.update({
                'endDate': str(pastEnd.isoformat()),
            })

            # Create a new expense for the future instance, matching the past instance in everything but start date
            futureStart = currentDate + getTimeDelta(int(recurPeriod))
            createExpense(email, name, budgetCategory, futureStart.isoformat(), endDate, amount, description, recurPeriod, recurring, oldOriginal)  
        elif (method == "future"):
            # Update original expense to have an end date right before the excludeStart date
            pastEnd = currentDate - getTimeDelta(0)
            expense_ref.update({
                'endDate': str(pastEnd.isoformat()),
            })
    except Exception as e:
        raise e

def deleteEarning(email, id, method, currentDate=date.today()):
    try:
        earning_ref = db.collection('earnings').document(id)
        earningDoc = earning_ref.get().to_dict()

        # First check to make sure the user owns the earning they want to delete
        if earningDoc["email"] != email:
            raise RuntimeError("User does not have access to this data!")
        
        name = earningDoc["name"]
        recurPeriod = earningDoc["recurPeriod"]
        endDate = earningDoc["endDate"]
        amount = earningDoc["amount"]
        description = earningDoc["description"]
        recurring = earningDoc["recurring"]
        oldOriginal = earningDoc["original"]

        if (recurring == False or method == "all"):
            # Get all of the earnings with the same original
            earningList = db.collection('earnings')\
                .where(filter=FieldFilter('email', '==', email))\
                .where(filter=FieldFilter('original', '==', oldOriginal))\
                .where(filter=FieldFilter('name', '==', name))\
                .stream() 
            
            for earning in earningList:
                cur_earning_ref = earning.reference

                cur_earning_ref.delete() 
        elif (method == "one"):
            # Update original earning to have an end date right before the excludeStart date
            pastEnd = currentDate - getTimeDelta(0)
            earning_ref.update({
                'endDate': str(pastEnd.isoformat()),
            })

            # Create a new earning for the future instance, matching the past instance in everything but start date
            futureStart = currentDate + getTimeDelta(int(recurPeriod))
            createExpense(email, name, futureStart.isoformat(), endDate, amount, description, recurPeriod, recurring, oldOriginal)  
        elif (method == "future"):
            # Update original earning to have an end date right before the excludeStart date
            pastEnd = currentDate - getTimeDelta(0)
            earning_ref.update({
                'endDate': str(pastEnd.isoformat()),
            })
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