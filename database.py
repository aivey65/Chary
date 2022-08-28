import firebase_admin
from firebase_admin import firestore

# Application Default credentials are automatically created.
app = firebase_admin.initialize_app()
db = firestore.client()

# Get a user and their information
def getUser(email):
    # Note: Use of CollectionRef stream() is prefered to get()
    userInfo = db.collection(u'users').where(u'email', u'==', email).get()

    print({userInfo.to_dict()})
    print(userInfo.exists())