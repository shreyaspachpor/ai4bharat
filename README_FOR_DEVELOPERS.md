# SkillFit - AI-Powered Trade Mock Interview Platform

> An intelligent platform for conducting mock interviews with AI agents to assess trade skills and provide real-time feedback.

## 🎯 About SkillFit

SkillFit uses AI-powered agents to conduct realistic mock interviews with candidates for various trade skills (electrician, plumber, welder, mason, carpenter, etc.). The platform supports multiple languages and provides detailed feedback on performance.

## 📚 Documentation

### For New Users / Developers
- **[QUICK_START.md](./QUICK_START.md)** - Essential commands to run the app (READ THIS FIRST!)
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Detailed setup guide with troubleshooting

### Project Structure
```
Skill_Fit-main/
├── 📱 Frontend (Next.js)
│   ├── app/                  # Pages and routes
│   ├── components/           # Reusable React components
│   ├── lib/                  # Utility functions
│   ├── firebase/             # Firebase configuration
│   └── types/                # TypeScript types
│
├── 🔧 Backend (FastAPI)
│   └── backend/
│       └── app/
│           ├── main.py       # FastAPI application
│           ├── config.py     # Configuration
│           ├── routers/      # API endpoints
│           ├── services/     # Business logic
│           └── models/       # Data schemas
│
└── ⚙️ Configuration Files
    ├── package.json          # Frontend dependencies
    ├── backend/requirements.txt # Backend dependencies
    └── .env.local            # Environment variables
```

## 🚀 Quick Start (TL;DR)

```bash
# Terminal 1 - Frontend
npm install
npm run dev                    # Runs on http://localhost:3001

# Terminal 2 - Backend
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001
```

See **[QUICK_START.md](./QUICK_START.md)** for detailed commands.

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Firebase** - Authentication & Database
- **Vapi** - Voice AI integration
- **React Hook Form** - Form handling

### Backend
- **FastAPI** - Python web framework
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation
- **Firebase Admin SDK** - Database & Auth
- **Google Generative AI** - LLM integration

## 📱 Features

- ✅ AI-powered mock interviews
- ✅ Multi-language support (English, Hindi, Kannada)
- ✅ Trade-specific questions
- ✅ Real-time feedback
- ✅ Voice interaction via Vapi
- ✅ Interview transcripts
- ✅ Admin dashboard
- ✅ NGO integration

## 🔗 Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3001 | Main application |
| Backend API | http://localhost:8001 | REST API |
| API Docs | http://localhost:8001/docs | Interactive API documentation |
| Health Check | http://localhost:8001/health | Backend status |

## 📖 API Endpoints

### Public Interview
- `GET /api/public/interview/{id}` - Fetch interview details
- `POST /api/public/interview/{id}` - Submit interview responses

### Authentication (Backend)
- `POST /api/auth/sign-up` - Register
- `POST /api/auth/sign-in` - Login
- `POST /api/auth/sign-out` - Logout

### Interviews (Backend)
- `POST /api/interviews/generate` - Create new interview
- `GET /api/interviews/{id}` - Get interview
- `POST /api/interviews/{id}` - Update interview

### Feedback (Backend)
- `GET /api/feedback/{id}` - Get feedback
- `POST /api/feedback/{id}` - Submit feedback

## 🎓 For Newcomers

### Prerequisites
- Node.js v18+ ([Install](https://nodejs.org/))
- Python v3.11+ ([Install](https://www.python.org/))
- npm (comes with Node.js)

### Setup Steps
1. Read **[QUICK_START.md](./QUICK_START.md)** - Takes 5 minutes
2. Read **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Detailed instructions
3. Run the commands
4. Open http://localhost:3001

### Test the App
After starting both servers, visit:
```
http://localhost:3001/interview/Vu-Q_1qIF0M4
```

This loads a test electrician interview.

## 🐛 Troubleshooting

### "Port already in use"
```bash
# Windows
netstat -ano | findstr 8001
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :8001
kill -9 <PID>
```

### "Module not found"
```bash
# Frontend
npm install

# Backend
cd backend
pip install -r requirements.txt
```

### Interview shows "Loading..."
- Ensure backend is running on port 8001
- Verify `.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:8001`
- Refresh browser and clear cache
- Check browser console for errors

See **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** for more troubleshooting.

## 🔐 Environment Variables

Configured in `.env.local`:
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_FIREBASE_*` - Firebase credentials
- `NEXT_PUBLIC_VAPI_*` - Vapi configuration
- `NEXT_PUBLIC_SARVAM_API_KEY` - Speech API key

**Important:** Don't commit `.env.local` with real secrets to Git!

## 📦 Available Scripts

### Frontend
```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Backend
```bash
# Install deps
pip install -r requirements.txt

# Run dev server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# Production
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --workers 4
```

## 🔄 Development Workflow

1. Frontend changes auto-reload (thanks to Next.js)
2. Backend changes need manual restart
3. Test changes at http://localhost:3001
4. Check logs in both terminal windows

## 📱 Sample Test URLs

After starting the app:

```
# Test Interview (Electrician)
http://localhost:3001/interview/Vu-Q_1qIF0M4

# Test Interview (Plumber)
http://localhost:3001/interview/test-interview-001

# API Documentation
http://localhost:8001/docs

# API Health Check
http://localhost:8001/health
```

## 🤝 Contributing

1. Create a feature branch
2. Make changes
3. Test thoroughly
4. Submit a pull request

## 📞 Support

For issues:
1. Check **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** troubleshooting section
2. Review error messages in terminal logs
3. Check browser console (F12)
4. Create an issue with error details

## 📄 License

Proprietary - All rights reserved

## 👥 Team

- AI/ML: Interview questions & feedback generation
- Frontend: User interface & experience
- Backend: API & database management
- Admin: Platform configuration & monitoring

---

**Questions?** Check [QUICK_START.md](./QUICK_START.md) or [SETUP_GUIDE.md](./SETUP_GUIDE.md)

**Ready to run?** Execute these commands:
```bash
npm install && cd backend && pip install -r requirements.txt && cd ..
# Terminal 1: npm run dev
# Terminal 2: cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8001
```
