"""Auth router – sign-up, sign-in, session management, current user."""

from fastapi import APIRouter, HTTPException, Response, Cookie, Request
from typing import Optional
from app.firebase_init import get_db, get_auth
from app.config import get_settings
from app.models.schemas import SignUpRequest, SignInRequest, SessionTokenRequest, UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/sign-up")
async def sign_up(req: SignUpRequest):
    db = get_db()
    settings = get_settings()

    user_ref = db.collection("users").document(req.uid)
    if user_ref.get().exists:
        return {"success": False, "message": "User already exists. Please sign in."}

    role = "admin" if req.email.lower() == settings.admin_email else "user"
    user_data = {"name": req.name, "email": req.email, "role": role}
    if req.aadhaarData:
        user_data["aadhaarDetails"] = req.aadhaarData
    user_ref.set(user_data)

    return {"success": True, "message": "Account created successfully. Please sign in."}


@router.post("/sign-in")
async def sign_in(req: SignInRequest, response: Response, request: Request):
    auth = get_auth()
    settings = get_settings()

    try:
        session_cookie = auth.create_session_cookie(
            req.id_token, expires_in=settings.session_duration
        )
        # On localhost development we serve over plain HTTP, so a `Secure` cookie
        # will be dropped by the browser. Only mark secure when on HTTPS.
        cookie_secure = request.url.scheme == "https"
        response.set_cookie(
            key="session",
            value=session_cookie,
            max_age=settings.session_duration,
            httponly=True,
            secure=cookie_secure,
            path="/",
            samesite="lax",
        )
        return {"success": True, "message": "Signed in successfully."}
    except Exception as e:
        print(f"Error signing in: {e}")
        return {"success": False, "message": "Failed to log into account. Please try again."}


@router.post("/sign-out")
async def sign_out(response: Response):
    response.delete_cookie(key="session", path="/")
    return {"success": True}


@router.get("/me")
async def get_current_user(session: Optional[str] = Cookie(None)):
    if not session:
        return {"user": None}

    auth = get_auth()
    db = get_db()
    settings = get_settings()

    try:
        decoded = auth.verify_session_cookie(session, check_revoked=True)
        uid = decoded["uid"]
        user_doc = db.collection("users").document(uid).get()

        if not user_doc.exists:
            # Fallback check for admin
            firebase_user = auth.get_user(uid)
            if firebase_user.email and firebase_user.email.lower() == settings.admin_email:
                return {
                    "user": {
                        "id": uid,
                        "name": "Admin",
                        "email": firebase_user.email,
                        "role": "admin",
                    }
                }
            return {"user": None}

        data = user_doc.to_dict()
        role = data.get("role") or (
            "admin" if data.get("email", "").lower() == settings.admin_email else "user"
        )

        return {
            "user": {
                "id": user_doc.id,
                "name": data.get("name", ""),
                "email": data.get("email", ""),
                "role": role,
            }
        }
    except Exception as e:
        print(f"Error verifying session: {e}")
        return {"user": None}


@router.get("/check")
async def is_authenticated(session: Optional[str] = Cookie(None)):
    if not session:
        return {"authenticated": False, "isAdmin": False}

    auth = get_auth()
    db = get_db()
    settings = get_settings()

    try:
        decoded = auth.verify_session_cookie(session, check_revoked=True)
        uid = decoded["uid"]
        user_doc = db.collection("users").document(uid).get()
        if not user_doc.exists:
            firebase_user = auth.get_user(uid)
            if firebase_user.email and firebase_user.email.lower() == settings.admin_email:
                return {"authenticated": True, "isAdmin": True}
            return {"authenticated": False, "isAdmin": False}

        data = user_doc.to_dict()
        role = data.get("role") or (
            "admin" if data.get("email", "").lower() == settings.admin_email else "user"
        )
        return {"authenticated": True, "isAdmin": role == "admin"}
    except Exception:
        return {"authenticated": False, "isAdmin": False}
