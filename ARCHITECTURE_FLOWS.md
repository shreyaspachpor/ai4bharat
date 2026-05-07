# SkillStack - Visual Architecture & Flow Diagrams

## 🏛️ SYSTEM ARCHITECTURE - TOP-DOWN VIEW

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                     │
│                          (Browser - React 19)                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐           │
│  │   Auth Pages     │  │ Interview Pages  │  │ Admin Dashboard  │           │
│  │  - Sign In       │  │  - Dashboard     │  │  - Review list   │           │
│  │  - Sign Up       │  │  - Create        │  │  - Filter/Flag   │           │
│  └────────┬─────────┘  │  - Conduct       │  │  - Seeded demo   │           │
│           │            │  - Feedback      │  └──────────────────┘           │
│           │            └────────┬─────────┘                                   │
│           │                     │                                             │
│  ┌────────┴─────────────────────┴──────────────────┐                        │
│  │         React Components & State Management     │                        │
│  │         (AuthForm, Agent, Feedback, etc.)       │                        │
│  └────────┬─────────────────────┬──────────────────┘                        │
│           │                     │                                             │
└───────────┼─────────────────────┼─────────────────────────────────────────────┘
            │                     │
            ▼                     ▼
┌──────────────────────────┐ ┌──────────────────────────┐
│   AUTHENTICATION         │ │   BUSINESS LOGIC         │
│   API ROUTES             │ │   API ROUTES             │
│   /api/auth/signout      │ │   /api/vapi/generate     │
│                          │ │   /api/vapi/extract      │
│                          │ │                          │
└────────────┬─────────────┘ └──────────────┬───────────┘
             │                             │
             ▼                             ▼
┌────────────────────────────────────────────────────────────┐
│              BACKEND SERVICES LAYER                        │
│                 (Next.js Server)                           │
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Firebase    │  │  Gemini AI   │  │   Vapi AI    │    │
│  │  Auth/DB     │  │  Scoring     │  │   Voice      │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                            │
│  ┌──────────────┐  ┌──────────────────────────────────┐   │
│  │ Firebase     │  │ Sarvam (kn/hi/en STT + TTS)      │   │
│  │ Storage      │  └──────────────────────────────────┘   │
│  └──────────────┘                                           │
│                                                            │
└────┬──────────────────────┬────────────────────────┬─────┘
     │                      │                        │
     ▼                      ▼                        ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Firebase    │  │  Firestore   │  │  Google      │
│  Auth        │  │  Database    │  │  Gemini      │
│  Service     │  │  (Real-time) │  │  API Service │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## 🔄 REQUEST RESPONSE CYCLE

```
USER ACTION
    │
    ├─ Click Button → Form Submit
    │
    ▼
FRONTEND (Client-Side)
    │
    ├─ React Component Update
    ├─ State Management (Hooks)
    ├─ Zod Validation
    │
    ▼
NETWORK REQUEST
    │
    ├─ POST /api/vapi/generate
    ├─ GET /api/interviews
    │
    ▼
BACKEND (Next.js API Route)
    │
    ├─ Receive Request
    ├─ Validate Input
    ├─ Extract Parameters
    │
    ▼
BUSINESS LOGIC
    │
    ├─ Process Request
    ├─ Call External Services (Firebase/Vapi/Sarvam/Gemini)
    ├─ Transform Data
    │
    ▼
DATABASE / EXTERNAL SERVICE
    │
    ├─ Firebase Firestore (Read/Write)
    ├─ Firebase Storage (Interview video)
    ├─ Sarvam (STT/TTS)
    ├─ Google Gemini API (Scoring + model answers)
    ├─ Vapi (Voice agent)
    │
    ▼
RESPONSE GENERATION
    │
    ├─ Collect Results
    ├─ Format Response (JSON)
    ├─ Include Metadata
    │
    ▼
SEND TO CLIENT
    │
    ├─ HTTP Response (200/400/500)
    │
    ▼
FRONTEND (Client-Side)
    │
    ├─ Parse Response
    ├─ Update Component State
    ├─ Re-render UI
    │
    ▼
USER SEES RESULT
```

---

## 📊 INTERVIEW CREATION FLOW

```
                    START
                     │
                     ▼
            ┌─────────────────────┐
            │ User clicks "Create"│
            └──────────┬──────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │ CreateInterviewForm Opens    │
        │ - Trade / Role (select)      │
        │ - District (select)          │
        │ - Interview Language (radio) │
        └──────────┬───────────────────┘
                   │
                   ▼
        ┌──────────────────────────┐
        │ User Fills Form &        │
        │ Validates Input          │
        └──────────┬───────────────┘
                   │
                   ▼
        ┌──────────────────────────┐
        │ Submit Button Clicked    │
        │ Form Data Collected      │
        └──────────┬───────────────┘
                   │
                   ▼ (POST Request)
        ┌──────────────────────────────────────┐
        │ /api/vapi/generate                   │
        │ Receives: trade (or role), district, │
        │           language, count, userid    │
        └──────────┬───────────────────────────┘
                   │
                   ▼
        ┌──────────────────────────────────────┐
        │ Backend Processing:                  │
        │ 1. Validate Input                    │
        │ 2. Select localized questions        │
        │    from /lib/questionBank.js         │
        │ 3. Store interview in Firestore      │
        └──────────┬───────────────────────────┘
                   │
                   ▼
        ┌──────────────────────────────────────┐
        │ Backend Processing:                  │
        │ 1. Create Interview Object           │
        │ 2. Add created timestamp + user id   │
        │ 3. Persist questions array           │
        └──────────┬───────────────────────────┘
                   │
                   ▼
        ┌──────────────────────────────────────┐
        │ Firestore (interviews collection)    │
        │ {                                    │
        │   id: "interview123",                │
        │   userId: "user456",                 │
        │   role: "electrician",               │
        │   questions: [...],                  │
        │   finalized: true,                   │
        │   district: "mysuru",                │
        │   interviewLanguage: "kn",           │
        │   createdAt: "2026-03-19T..."        │
        │ }                                    │
        └──────────┬───────────────────────────┘
                   │
                   ▼ (JSON Response)
        ┌──────────────────────────────────────┐
        │ Return to Frontend:                  │
        │ { success: true }                    │
        └──────────┬───────────────────────────┘
                   │
                   ▼
        ┌──────────────────────────────────────┐
        │ Frontend Updates State               │
        │ Shows Success Toast                  │
        │ Redirects to Interview Page          │
        └──────────┬───────────────────────────┘
                   │
                   ▼
        ┌──────────────────────────────────────┐
        │ User Sees Interview Card             │
        │ with 3 Action Buttons:               │
        │ - Start Interview (Begin Vapi Call)  │
        │ - View Details                       │
        │ - Delete Interview                   │
        └──────────┬───────────────────────────┘
                   │
                   ▼
                  END
```

---

## 🎙️ VOICE INTERVIEW EXECUTION FLOW

```
START INTERVIEW
       │
       ▼
┌──────────────────────────┐
│ User Clicks "Start"      │
│ Interview Page           │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Agent.tsx Component Loads         │
│ 1. Fetches Interview Data         │
│ 2. Retrieves Questions from DB    │
│ 3. Initializes Vapi SDK           │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Browser Requests Microphone       │
│ User Grants Permission            │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Vapi Voice Agent Initialization   │
│ Connection Established            │
└──────────┬───────────────────────┘
           │
   ┌───────┴─────────────────┐
   │ AI AGENT FLOW BEGINS    │
   │                         │
   ▼                         ▼
┌────────────────────┐  ┌──────────────────────────┐
│ Q1 (Text-to-Speech)│  │ User Listens to Question │
│ "Tell me about..."│  │                          │
└────────────────────┘  └──────────────────────────┘
                              │
                              ▼
                        ┌──────────────────────────┐
                        │ User Speaks Answer       │
                        │ (Microphone Recording)   │
                        └──────────┬───────────────┘
                                   │
                                   ▼
                        ┌──────────────────────────┐
                        │ Client VAD + Sarvam STT:  │
                        │ 1. Detect end-of-utterance│
                        │ 2. Speech-to-Text (kn/hi/en)│
                        │ 3. Send text to Vapi      │
                        └──────────┬───────────────┘
                                   │
                                   ▼
                        ┌──────────────────────────┐
                        │ Transcript Buffering:    │
                        │ [{role:"assistant",...}, │
                        │  {role:"user",...}]      │
                        └──────────┬───────────────┘
                                   │
                                   ▼
                        ┌──────────────────────────┐
                        │ AI Generates Next Query: │
                        │ - Evaluate Answer        │
                        │ - Decide Next Move       │
                        │ - Generate Q2            │
                        └──────────┬───────────────┘
                                   │
┌──────────────────────────────────┘
│ Q2 (Text-to-Speech)
│ "Follow-up question..."
│
└─► [Repeat Q1→Q2→Q3→... for all questions]

    After Last Question:
    │
    ▼
┌──────────────────────────────────┐
│ AI Agent: "Thank you for..."     │
│ End Interview (Agent Hangs Up)   │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Stop video recording + upload     │
│ to Firebase Storage (webm)        │
│ then update interviews.videoUrl   │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ UI Updates:                       │
│ 1. Show Interview Complete Banner│
│ 2. Display Transcript Preview    │
│ 3. Enable "View Feedback" Button  │
│ 4. Create feedback (server action)│
└──────────┬───────────────────────┘
           │
           ▼
          END
```

---

## 📈 FEEDBACK GENERATION & ANALYSIS FLOW

```
INTERVIEW COMPLETE
       │
       ▼
┌──────────────────────────────────┐
│ User Clicks "View Feedback"      │
│ Feedback Page Loads              │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Check if Feedback Exists         │
│ in Firestore                     │
└─────┬──────────────┬─────────────┘
      │              │
      ▼              ▼
   YES          NO
   │             │
   │             ▼
   │    ┌─────────────────────────┐
   │    │ Show "Generating..."    │
   │    │ Spinner                 │
   │    └──────────┬──────────────┘
   │               │
   │               ▼
   │    ┌─────────────────────────────────────┐
   │    │ Call createFeedback() Server Action │
   │    └──────────┬────────────────────────┘
   │               │
   │               ▼
   │    ┌─────────────────────────────────────┐
   │    │ Step 1: Fetch Interview & Transcript│
   │    │ Get all questions and user answers  │
   │    └──────────┬────────────────────────┘
   │               │
   │               ▼
   │    ┌─────────────────────────────────────┐
   │    │ Step 2: Generate Model Answers      │
   │    │ Call Gemini API:                    │
    │    │ "Generate model answers for these  │
    │    │  questions for a trade interview"  │
   │    └──────────┬────────────────────────┘
   │               │
   │               ▼
   │    ┌─────────────────────────────────────┐
   │    │ Gemini Returns Model Answers:       │
   │    │ [                                   │
   │    │   "Model answer for Q1...",         │
   │    │   "Model answer for Q2...",         │
   │    │   ...                               │
   │    │ ]                                   │
   │    └──────────┬────────────────────────┘
   │               │
   │               ▼
   │    ┌─────────────────────────────────────┐
   │    │ Step 3: Analyze Performance         │
   │    │ Call Gemini API with:              │
   │    │ - Formatted Transcript              │
   │    │ - All Model Answers                 │
   │    │ - Evaluation Schema                 │
   │    │                                     │
   │    │ Returns: {                          │
    │    │   relevance: 82,                    │
    │    │   clarity: 78,                      │
    │    │   skillConfidence: 74,              │
    │    │   fitmentLabel: "Needs training",   │
    │    │   summary: "..."                    │
   │    │ }                                   │
   │    └──────────┬────────────────────────┘
   │               │
   │               ▼
   │    ┌─────────────────────────────────────┐
    │    │ Step 4: Analyze Speech Quality      │
    │    │ Heuristic metrics from transcript:  │
    │    │ - estimatedWPM                      │
    │    │ - fillerWordPercentage              │
    │    │ - completenessScore                 │
   │    └──────────┬────────────────────────┘
   │               │
   │               ▼
   │    ┌─────────────────────────────────────┐
   │    │ Step 5: Store Feedback in Firestore │
   │    │ {                                   │
   │    │   id: "feedback123",                │
   │    │   interviewId: "int456",            │
    │    │   relevance: 82,                    │
    │    │   clarity: 78,                      │
    │    │   skillConfidence: 74,              │
    │    │   fitmentLabel: "Needs training",   │
   │    │   modelAnswers: [...],              │
    │    │   transcript: [...],                │
   │    │   createdAt: "2026-03-19T..."       │
   │    │ }                                   │
   │    └──────────┬────────────────────────┘
   │               │
   └───────────────┼─────────────────────────┐
                   │                         │
                   ▼                         ▼
        ┌──────────────────────┐  ┌──────────────────────┐
        │ Retrieve Feedback    │  │ Display Cached       │
        │ from Firestore       │  │ Feedback             │
        └──────────┬───────────┘  └──────────┬───────────┘
                   │                         │
                   └────────────┬─────────────┘
                                │
                                ▼
                    ┌────────────────────────────┐
                    │ FeedbackTabs Component     │
                    │ Shows:                     │
                    │ - Overall Score Card       │
                    │ - Category Breakdowns      │
                    │ - Strengths List           │
                    │ - Improvements List        │
                    │ - Model Answers            │
                    │ - Speaking Quality         │
                    └────────────┬───────────────┘
                                │
                                ▼
                    ┌────────────────────────────┐
                    │ User Sees Full Feedback    │
                    │ with all metrics and data  │
                    └────────────┬───────────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
        ┌────────────────────┐  ┌────────────────────┐
        │ Download PDF       │  │ Share Results      │
        │ Button Active      │  │ Button Active      │
        └────────────────────┘  └────────────────────┘
```

---

## 🗄️ DATABASE RELATIONSHIPS DIAGRAM

```
┌─────────────┐
│    Users    │
├─────────────┤
│ uid (PK)    │──────┐
│ name        │      │
│ email       │      │ 1
│ createdAt   │      │
└─────────────┘      │ : (one user has many)
                     │
              ┌──────┴──────────────┬──────────────┐
              │                     │              │
              │ *                   │ *            │
              ▼                     ▼              ▼
          ┌──────────────┐  ┌──────────────┐   ┌─────────────────────────┐
          │ Interviews   │  │  Feedback    │   │ Firebase Storage        │
          ├──────────────┤  ├──────────────┤   ├─────────────────────────┤
          │ id (PK)      │  │ id (PK)      │   │ interviews/{id}/        │
          │ userId (FK)  │  │ interviewId  │   │ recording.webm          │
          │ role(trade)  │  │ userId (FK)  │   └─────────────────────────┘
          │ district     │  │ relevance    │
          │ language     │  │ clarity      │
          │ questions[]  │  │ skillConfidence│
          │ videoUrl     │  │ fitmentLabel │
          │ createdAt    │  │ createdAt    │
          └──────────────┘  └──────────────┘
```

---

## 🔐 SECURITY FLOW

```
┌──────────────┐
│ User Request │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────┐
│ 1. Check Session Cookie (httpOnly)
│    - Valid & Not Expired?        │
└──────┬───────────────┬───────────┘
       │ Yes           │ No
       │               ▼
       │        ┌──────────────┐
       │        │ Reject       │
       │        │ Redirect:    │
       │        │ /sign-in     │
       │        └──────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ 2. Extract User ID from Session  │
│    Verify Token with Firebase    │
└──────┬───────────────┬───────────┘
       │ Valid         │ Invalid
       │               ▼
       │        ┌──────────────┐
       │        │ New Login    │
       │        │ Required     │
       │        └──────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ 3. Permission Check              │
│    - User owns this resource?    │
│    - userId === data.userId?     │
└──────┬───────────────┬───────────┘
       │ Yes           │ No
       │               ▼
       │        ┌──────────────┐
       │        │ 403 Forbidden│
       │        └──────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ 4. Input Validation              │
│    Zod Schema Validation         │
└──────┬───────────────┬───────────┘
       │ Valid         │ Invalid
       │               ▼
       │        ┌──────────────┐
       │        │ 400 Bad Req  │
       │        └──────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ 5. Rate Limiting (if configured) │
│    Check Request Quota           │
└──────┬───────────────┬───────────┘
       │ Allowed       │ Exceeded
       │               ▼
       │        ┌──────────────┐
       │        │ 429 Too Many │
       │        │ Requests     │
       │        └──────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ ✅ Request Authorized            │
│    Proceed with Operation         │
└──────────────────────────────────┘
```

---

## 📊 DEPLOYMENT ARCHITECTURE

```
┌─────────────────────────────────────────────────────────┐
│                    VERCEL (Deployment)                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Serverless Functions (Next.js API Routes)       │  │
│  │  - Auto-scaling                                  │  │
│  │  - Cold start optimized                          │  │
│  │  - Global CDN                                    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Static Assets & Pages (Built-in Optimization)  │  │
│  │  - Image optimization                            │  │
│  │  - CSS/JS minification                           │  │
│  │  - Edge caching                                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
          │                          │
          ▼                          ▼
┌──────────────────────┐  ┌──────────────────────┐
│ Firebase             │  │ External APIs        │
│ (Firestore + Auth)   │  │ - Google Gemini      │
│ + Storage (video)    │  │ - Vapi Voice         │
│                      │  │ - Sarvam STT/TTS      │
│ Real-time DB         │  │                      │
│ Authentication       │  │ Rate Limited         │
└──────────────────────┘  └──────────────────────┘
```

---

## ✨ Summary

- **Current modules**: Auth, Interview Setup, Voice Interview, Feedback, Admin (prototype)
- **Modular Design** enables easy feature additions
- **Secure flow** with authentication & authorization
- **Scalable architecture** using serverless + real-time DB
- **AI-powered** scoring + model answers (Gemini) and multilingual voice (Sarvam)
- **Production-ready** with error handling
