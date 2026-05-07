"""Firebase Admin SDK initialization – singleton pattern."""

import firebase_admin
from firebase_admin import credentials, auth, firestore
from app.config import get_settings

fb_auth_module = None
db = None

def _init_firebase():
    global fb_auth_module, db
    
    settings = get_settings()

    try:
        if not firebase_admin._apps:
            cred = credentials.Certificate(
                {
                    "type": "service_account",
                    "project_id": settings.firebase_project_id,
                    "client_email": settings.firebase_client_email,
                    "private_key": settings.firebase_private_key.replace("\\n", "\n"),
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
            )
            firebase_admin.initialize_app(cred)

        fb_auth_module = auth
        db = firestore.client()
    except Exception as e:
        print(f"Warning: Firebase initialization failed: {e}")
        print("Some features will not work without Firebase credentials.")
        fb_auth_module = None
        db = None

    return fb_auth_module, db


_init_firebase()


def get_db():
    """Return Firestore client."""
    global db
    if db is None:
        _init_firebase()
    return db


def get_auth():
    """Return firebase_admin.auth module."""
    global fb_auth_module
    if fb_auth_module is None:
        _init_firebase()
    return fb_auth_module
