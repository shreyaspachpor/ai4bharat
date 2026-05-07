# SkillFit - Complete Setup Guide for Newcomers

This guide walks you through setting up and running the entire SkillFit application (Frontend + Backend).

## 📋 Prerequisites

Before starting, ensure you have installed:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.11 or higher) - [Download](https://www.python.org/)
- **npm** (comes with Node.js)
- **Git** (for cloning the repo)

### Verify installations:
```bash
node --version      # Should show v18+
npm --version       # Should show 8+
python --version    # Should show 3.11+
```

## 🚀 Quick Start (5 minutes)

### Step 1: Clone or navigate to the project
```bash
# If cloning
git clone <your-repo-url>
cd Skill_Fit-main

# If already in the folder
cd d:\Skill_Fit-main
```

### Step 2: Install Frontend Dependencies
```bash
npm install
```
*This installs all Node.js packages for the Next.js frontend.*

### Step 3: Install Backend Dependencies
```bash
cd backend
python -m pip install -r requirements.txt
```
*This installs all Python packages for the FastAPI backend.*

### Step 4: Run Both Servers

#### **Terminal 1 - Frontend Server:**
```bash
# From project root (d:\Skill_Fit-main)
npm run dev
```
The frontend will be available at: **http://localhost:3001**

#### **Terminal 2 - Backend Server:**
```bash
# From project root (d:\Skill_Fit-main)
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001
```
The backend API will be available at: **http://localhost:8001**

## 📍 Access Points

Once both servers are running:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3001 | Main web application |
| **Backend API** | http://localhost:8001 | REST API endpoints |
| **API Documentation** | http://localhost:8001/docs | Interactive Swagger UI |
| **Health Check** | http://localhost:8001/health | API health status |

## 📁 Project Structure

```
Skill_Fit-main/
├── app/                      # Next.js frontend
│   ├── (root)/              # Main routes
│   ├── (auth)/              # Authentication pages
│   ├── admin/               # Admin dashboard
│   ├── api/                 # Next.js API routes
│   └── page.tsx             # Homepage
├── components/              # React components
├── backend/                 # FastAPI backend
│   └── app/
│       ├── main.py          # FastAPI app entry point
│       ├── config.py        # Settings & configuration
│       ├── routers/         # API route handlers
│       ├── services/        # Business logic
│       └── models/          # Data schemas
├── package.json             # Frontend dependencies
├── backend/requirements.txt  # Backend dependencies
└── .env.local              # Environment variables
```

## 🛠️ Common Commands

### **Frontend Commands**
```bash
# Start development server
npm run dev

# Build for production
npm build

# Run production server
npm start

# Run linting
npm run lint
```

### **Backend Commands**
```bash
# Install dependencies
pip install -r requirements.txt

# Run development server with auto-reload
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# Run production server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001

# Check API docs
curl http://localhost:8001/docs
```

## 🔐 Environment Variables

The app uses environment variables stored in `.env.local`:

- `NEXT_PUBLIC_API_URL` - Backend API URL (should be `http://localhost:8001`)
- `NEXT_PUBLIC_FIREBASE_*` - Firebase configuration (for authentication & database)
- `NEXT_PUBLIC_VAPI_*` - Vapi AI configuration (for voice interviews)
- `NEXT_PUBLIC_SARVAM_API_KEY` - Speech recognition API key

These are already configured. **Do not commit secrets to Git!**

## 🐛 Troubleshooting

### **Port Already in Use**

If you get "Port 8001 already in use" error:

**Windows (PowerShell):**
```bash
# Find process using port 8001
netstat -ano | findstr 8001

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
# Find process using port 8001
lsof -i :8001

# Kill the process
kill -9 <PID>
```

### **Module Not Found Error**

**Frontend:**
```bash
# Clear cache and reinstall
rm node_modules package-lock.json
npm install
npm run dev
```

**Backend:**
```bash
# Reinstall dependencies
pip install --upgrade -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001
```

### **Port 3000 Already in Use**

The frontend automatically uses port 3001 if 3000 is busy. If you need port 3000:
```bash
# Windows
netstat -ano | findstr 3000
taskkill /PID <PID> /F

# Then restart
npm run dev
```

### **Firebase Connection Issues**

The backend uses placeholder Firebase credentials in development. If you need real Firebase:
1. Get your Firebase credentials from Firebase Console
2. Update `backend/.env` with your credentials
3. Restart the backend server

### **Interview Page Shows "Loading..."**

This typically means:
1. ✅ Verify backend is running on port 8001
2. ✅ Check that `.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:8001`
3. ✅ Clear browser cache: `Ctrl+Shift+Delete` → Clear cache
4. ✅ Restart frontend: `npm run dev`

## 📚 API Endpoints

### **Authentication**
- `POST /api/auth/sign-up` - Register new user
- `POST /api/auth/sign-in` - Login user
- `POST /api/auth/sign-out` - Logout

### **Interviews**
- `POST /api/interviews/generate` - Create new interview
- `GET /api/interviews/{id}` - Fetch interview details
- `POST /api/interviews/{id}` - Submit interview responses

### **Feedback**
- `GET /api/feedback/{id}` - Get feedback for interview
- `POST /api/feedback/{id}` - Save feedback

## 🔄 Development Workflow

1. **Make code changes** in either frontend or backend
2. **Frontend changes auto-reload** thanks to Next.js hot reload
3. **Backend changes require restart** (use `--reload` flag for auto-restart)
4. **Test in browser** at http://localhost:3001
5. **Check API** at http://localhost:8001/docs

## 📦 Building for Production

### **Frontend Build**
```bash
npm run build
npm start
```

### **Backend Production**
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --workers 4
```

## 🆘 Need Help?

- Check logs in both terminal windows
- Review error messages carefully
- Restart both servers: Stop (Ctrl+C) and run again
- Clear browser cache if UI doesn't update
- Ensure all prerequisites are installed

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Frontend loads at http://localhost:3001
- [ ] Backend API responds at http://localhost:8001/health
- [ ] API docs visible at http://localhost:8001/docs
- [ ] No errors in terminal windows
- [ ] Can navigate the application
- [ ] Both servers are running

---

**Happy coding! 🎉**
