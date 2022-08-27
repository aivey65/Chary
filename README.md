# Chary
Definition:
### chary /ˈtʃɛər i/ 
##### adjective
    1. discreetly cautious

         a. hesitant and vigilant about dangers and risks
    
         b. slow to grant, accept, or expend
         
*“Chary.” Merriam-Webster.com Dictionary, Merriam-Webster,*
*https://www.merriam-webster.com/dictionary/chary.*

## Summary
Chary is a **budgeting application** that keeps track of a user's budgets and expenses to help them reach their financial goals and spend less. Chary creates visuals that help users see exactly how much of their money goes into their set categories. For example, a user could have Chary keep track of how much money they spend a month on groceries versus takeout.

Users can **login using Google** and their information is stored in a **firestore database** so that they can come back to their budgets at any time.

## Development Workflow
#### Dependencies
Dependencies used are listed in requirements.txt. You can create a virtual environment and then run 

> pip install -r requirements.txt

to install them all at once.

#### Configuration for Google login
1. In order to use Google's login authentication method, you need to create a client on Google Cloud Platform. [Follow these instructions](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid) to get a client ID and client secret. 
2. Download the generated client secret JSON file and add it to the project's parent folder (so as not to include it in the project files or accidentally upload online) as 'client_secret.json', or change the path referencing it in main.py.
3. Add the client id, client secret, and a [randomly generated secret_key](https://pyquestions.com/where-do-i-get-a-secret-key-for-flask) to a .env file using the provided .env.template file. 

#### Running Flask server locally
You need to make sure that Flask knows where your app code is. You need to specify the file name of the flask app:

> export FLASK_APP=main

then you can run

> py -m flask run
