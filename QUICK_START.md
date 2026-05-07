# 🚀 SkillFit - Quick Start Commands

## One-Time Setup (First Time Only)

```bash
# Navigate to project folder
cd d:\Skill_Fit-main

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
python -m pip install -r requirements.txt
cd ..
```

## Run the App (Every Time)

### Option 1: Using 2 Terminal Windows (Recommended for Development)

**Terminal 1 - Frontend:**
```bash
cd d:\Skill_Fit-main
npm run dev
```
✅ Frontend will be ready at: http://localhost:3001

**Terminal 2 - Backend:**
```bash
cd d:\Skill_Fit-main\backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001
```
✅ Backend will be ready at: http://localhost:8001

### Option 2: Using Batch/Script Files (Windows)

**Create `start-frontend.bat` in project root:**
```batch
@echo off
title SkillFit Frontend
npm run dev
pause
```

**Create `start-backend.bat` in project root:**
```batch
@echo off
title SkillFit Backend
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001
pause
```

Then just double-click both files.

## What to Expect

After running both commands:

| What | Where | Status |
|------|-------|--------|
| 📱 App UI | http://localhost:3001 | ✅ Ready |
| 🔌 API | http://localhost:8001 | ✅ Running |
| 📖 API Docs | http://localhost:8001/docs | ✅ Available |

## Test Interview

Click this link after app starts:
```
http://localhost:3001/interview/Vu-Q_1qIF0M4
```

Should load a test electrician interview (Electrician trade, English language)

## Common Issues & Fixes

### ❌ "npm: command not found"
**Fix:** Install Node.js from https://nodejs.org/

### ❌ "python: command not found"
**Fix:** Install Python from https://www.python.org/

### ❌ "Port 8001 already in use"
**Fix (Windows):**
```bash
netstat -ano | findstr 8001
taskkill /PID <PID> /F
```

### ❌ "Cannot find module" (Frontend)
**Fix:**
```bash
rm node_modules package-lock.json
npm install
npm run dev
```

### ❌ "ModuleNotFoundError" (Backend)
**Fix:**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001
```

### ❌ Interview shows "Loading..." forever
**Fix:**
1. Make sure backend is running on port 8001
2. Refresh the page (Ctrl+R or Cmd+R)
3. Clear browser cache (Ctrl+Shift+Delete)
4. Restart frontend: Stop (Ctrl+C) → npm run dev

## File Structure You'll Use

```
Skill_Fit-main/
├── app/                    ← Frontend (Next.js)
├── backend/                ← Backend (FastAPI)
├── components/             ← React components
├── .env.local             ← Config (don't edit)
├── package.json           ← Frontend packages
├── backend/requirements.txt ← Backend packages
└── SETUP_GUIDE.md         ← Detailed guide
```

## Environment Variables

Already configured in `.env.local`:
- Backend API: `http://localhost:8001`
- Firebase credentials (placeholder for development)
- API keys for Vapi & Sarvam (AI services)

**Don't commit `.env.local` to Git!**

## Next Steps

1. ✅ Run both servers
2. ✅ Open http://localhost:3001
3. ✅ Test interview link
4. ✅ Explore the dashboard
5. ✅ Read detailed SETUP_GUIDE.md for more info

---

**That's it! You're ready to develop.** 🎉
