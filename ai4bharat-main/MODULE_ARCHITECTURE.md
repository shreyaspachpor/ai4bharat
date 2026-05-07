# SkillStack - Module Architecture & Components

## 📦 PROJECT STRUCTURE: CURRENT MODULES IN THIS REPO

```
SkillStack (Root)
│
├── MODULE 1: AUTHENTICATION & USER MANAGEMENT ✅
│   ├── Pages:
│   │   ├── app/(auth)/sign-in/page.tsx
│   │   ├── app/(auth)/sign-up/page.tsx
│   │   └── app/(auth)/layout.tsx
│   │
│   ├── Components:
│   │   ├── components/AuthForm.tsx
│   │   └── components/LogoutButton.tsx
│   │
│   ├── Actions (Server-Side):
│   │   └── lib/actions/auth.action.ts
│   │       ├── signUp()
│   │       ├── signIn()
│   │       ├── setSessionCookie()
│   │       ├── getCurrentUser()
│   │       └── signOut()
│   │
│   └── Services:
│       └── firebase/admin.ts (Firebase Auth Admin)
│
├── MODULE 2: TRADE ASSESSMENT CREATION & INTERVIEW SETUP ✅
│   ├── Pages:
│   │   ├── app/(root)/page.tsx (Dashboard)
│   │   ├── app/(root)/interview/page.tsx (List Interviews)
│   │   └── app/(root)/interview/[id]/* (Interview Details)
│   │
│   ├── Components:
│   │   ├── components/CreateInterviewForm.tsx
│   │   ├── components/InterviewCard.tsx
│   │   ├── components/DeleteInterviewButton.tsx
│   │
│   ├── API Routes:
│   │   └── app/api/vapi/generate/route.ts
│   │       └── POST - Create a trade interview from the local question bank
│   │
│   ├── Actions (Server-Side):
│   │   └── lib/actions/general.action.ts
│   │       ├── getInterviewById()
│   │       ├── getLatestInterviews()
│   │       ├── getInterviewsByUserId()
│   │       ├── getCompletedInterviewsByUserId()
│   │       └── deleteInterview()
│   │
│   └── Database:
│       └── Firestore Collection: "interviews"
│
├── MODULE 3: AI-POWERED VOICE INTERACTION ✅
│   ├── Pages:
│   │   └── app/(root)/interview/[id]/page.tsx
│   │
│   ├── Components:
│   │   ├── components/Agent.tsx (Vapi Integration)
│   │   └── components/SpeakingQualityPanel.tsx
│   │
│   ├── SDK:
│   │   └── lib/vapi.sdk.ts (Vapi AI Wrapper)
│   │
│   ├── API Routes:
│   │   └── app/api/vapi/extract-interview-fields/route.ts
│   │
│   ├── External Services:
│   │   ├── Vapi Voice Agent (LLM conversation)
│   │   └── Sarvam (STT + TTS for kn/hi/en)
│   │
│   └── Features:
│       ├── Real-time voice conversation
│       ├── Transcript generation
│       ├── Speech quality analysis
│       ├── Video recording upload to Firebase Storage
│       └── Face presence badge (client-side)
│
├── MODULE 4: FEEDBACK ANALYSIS & REPORTING ✅
│   ├── Pages:
│   │   ├── app/(root)/interview/[id]/feedback/page.tsx
│   │   └── app/(root)/interview/[id]/answers/page.tsx
│   │
│   ├── Components:
│   │   ├── components/FeedbackModal.tsx
│   │   ├── components/FeedbackTabs.tsx
│   │   ├── components/SpeakingQualityDetailsPage.tsx
│   │   ├── components/DownloadFeedbackPDFButton.tsx
│   │   ├── components/DeepDiveQuestionsSection.tsx
│   │   └── components/DisplayTechIcons.tsx
│   │
│   ├── API Routes:
│   │   └── app/api/vapi/extract-interview-fields/route.ts
│   │
│   ├── Actions (Server-Side):
│   │   └── lib/actions/general.action.ts
│   │       ├── createFeedback()
│   │       └── getFeedbackByInterviewId()
│   │
│   ├── Services:
│   │   ├── Google Gemini API (Feedback Generation)
│   │   ├── PDF Generation (jsPDF + html2canvas)
│   │   └── Analytics Engine
│   │
│   └── Database:
│       └── Firestore Collection: "feedback"

└── MODULE 5: ADMIN DASHBOARD (Prototype) ✅
    ├── Pages:
    │   └── app/(root)/admin/page.tsx
    ├── Components:
    │   └── app/(root)/admin/AdminDashboardClient.tsx
    └── Notes:
        └── Uses seeded demo data from constants/index.ts
```

---

## 🔧 MODULE 1: AUTHENTICATION & USER MANAGEMENT

### Purpose

Secure user authentication, registration, and session management.

### Components

```
AuthForm.tsx
├── Input Fields: Email, Password, Name
├── Form Validation: Zod Schema
├── Firebase Auth Integration
└── Submit Handler: signUp/signIn Actions

LogoutButton.tsx
├── Logout Trigger
└── Session Cleanup
```

### Data Flow

```
User Registration
    ↓
AuthForm.tsx Component
    ↓
signUp(uid, name, email) Action
    ↓
Firebase Auth + Firestore
    ↓
User Created ✓
```

### Database Schema (users collection)

```json
{
  "uid": "string (Primary Key)",
  "name": "string",
  "email": "string (Unique)",
  "createdAt": "timestamp"
}
```

---

## 🎯 MODULE 2: INTERVIEW MANAGEMENT & GENERATION

### Purpose

Create and manage trade-skill assessments (trade + district + language) using a built-in question bank.

### Sub-Components

#### 2.1 Interview Creation

```
CreateInterviewForm.tsx
├── Input Fields:
│   ├── Trade / Role (select)
│   ├── District (select)
│   └── Interview Language (kn / hi / en)
│
├── Form Validation
└── Submit Handler
    └── POST /api/vapi/generate
```

#### 2.2 Question Generation Engine

```
API Route: /api/vapi/generate
├── Input: userid, trade (or role), district, language, count
├── Service: Local question bank (/lib/questionBank.js)
├── Processing:
│   ├── Normalize trade name
│   ├── Select localized questions (kn/hi/en)
│   └── Persist interview doc to Firestore
└── Output: interviewId
```

#### 2.3 Interview List & Management

```
Pages:
├── app/(root)/interview/page.tsx
│   └── Display all user interviews
│
└── components/InterviewCard.tsx
    ├── Interview Meta (Role, Date, Status)
    ├── Action Buttons (Start, Delete, View)
    └── Quick Stats (Questions Count, Score)
```

### Database Schema (interviews collection)

```json
{
  "id": "string (Primary Key)",
  "userId": "string (Foreign Key)",
  "role": "string (trade)",
  "level": "string (N/A)",
  "type": "string (trade)",
  "techstack": ["string"],
  "questions": ["string"],
  "finalized": "boolean",
  "createdAt": "timestamp",
  "district": "string",
  "interviewLanguage": "kn|hi|en",
  "videoUrl": "string (URL)"
}
```

---

## 🎤 MODULE 3: AI-POWERED VOICE INTERACTION

### Purpose

Real-time voice conversation with AI agent, transcription, and speech analysis.

### Core Component

```
Agent.tsx (Vapi Integration)
├── State Management:
│   ├── conversation history
│   ├── current question index
│   ├── user responses
│   └── call status
│
├── Vapi SDK Integration:
│   ├── Initialize voice connection
│   ├── Listen for events
│   ├── Handle responses
│   └── Manage call lifecycle
│
└── Features:
    ├── Start Interview Button
    ├── Hang Up Button
    ├── Mute/Unmute
    ├── Volume Control
    └── Real-time Transcript Display
```

### Voice Flow

```
1. User clicks "Start Interview"
2. Agent.tsx initializes Vapi
3. AI Agent greets user (Text-to-Speech)
4. User speaks answer
5. Sarvam transcribes candidate (Speech-to-Text for kn/hi/en)
6. Transcript is appended to in-memory conversation and stored in feedback at end
7. AI evaluates and asks next question
8. Repeat until all questions done
9. Call ends, transcripts collected
```

### Transcript Schema

```json
{
  "interviewId": "string",
  "role": "user|agent",
  "content": "string",
  "timestamp": "timestamp",
  "duration": "number (seconds)"
}
```

### Speech Quality Analysis

```
components/SpeakingQualityPanel.tsx
├── Metrics:
│   ├── Estimated WPM
│   ├── Filler word counts / percentage
│   └── Completeness score (heuristic)
│
└── Visualization:
    ├── Progress Bars
    ├── Score Cards
    └── Waveform Display
```

---

## 📊 MODULE 4: FEEDBACK ANALYSIS & REPORTING

### Purpose

Generate comprehensive feedback, score performance, and create downloadable reports.

### Feedback Generation Pipeline

```
Interview Complete
    ↓
Transcript Collection
    ↓
createFeedback() Server Action
    ├── Input: interviewId, userId, transcript
    │
    ├── Step 1: Generate Model Answers
    │   └── Gemini API → Model answers for each question
    │
    ├── Step 2: Score & Classify
    │   └── Gemini API → relevance, clarity, skillConfidence, fitmentLabel, summary
    │
    └── Step 3: Store Feedback
        └── Firestore
```

### Components

```
FeedbackModal.tsx
├── Display Overall Score
├── Show Category Breakdowns
├── List Strengths
├── Show Improvement Areas
└── Action Buttons (Download, Share)

FeedbackTabs.tsx
├── Tab 1: Overall Score
├── Tab 2: Category Breakdown
├── Tab 3: Model Answers
├── Tab 4: Speaking Quality
└── Tab 5: Detailed Feedback

DownloadFeedbackPDFButton.tsx
├── Convert UI to Canvas
├── Generate PDF
└── Download
```

### Feedback Schema

```json
{
  "id": "string",
  "interviewId": "string",
  "userId": "string",
  "relevance": "number (0-100)",
  "clarity": "number (0-100)",
  "skillConfidence": "number (0-100)",
  "fitmentLabel": "Job-ready|Needs training|Requires manual verification|Low confidence / poor quality",
  "summary": "string (2 sentences max)",
  "modelAnswers": ["string"],
  "speechQuality": {
    "estimatedWPM": "number",
    "fillerWordPercentage": "number",
    "completenessScore": "number"
  },
  "transcript": [{ "role": "assistant|user", "content": "string" }],
  "createdAt": "timestamp"
}
```

---

## 🧭 MODULE 5: ADMIN DASHBOARD (Prototype)

### Purpose

Provide a decision layer for stakeholders (filters, flagged cases, fitment summaries).

### Current Status

The Admin dashboard UI exists, but it is **not yet connected to Firestore** — it renders seeded demo data.

### Files

- `app/(root)/admin/page.tsx` (route + role gate)
- `app/(root)/admin/AdminDashboardClient.tsx` (filters/table UI)
- `constants/index.ts` (`seededCandidates` demo dataset)

---

## 🔄 Component Interaction Map

```
┌─────────────────────────────────────────────────────┐
│                    AUTH MODULE                      │
│         (Login/SignUp → Session → User)             │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────┐
│               INTERVIEW MODULE                       │
│    (Create Assessment → Trade/District/Language)     │
└──────────────┬──────────────────────────────────────┘
               │
  ┌──────────────────────────────┐
  │   VOICE INTERACTION MODULE    │
  │   (Conduct Interview)         │
  └────────────┬─────────────────┘
               │
               ▼
  ┌──────────────────────────────┐
  │  FEEDBACK ANALYSIS MODULE     │
  │ (Score → Report → Download)   │
  └──────────────────────────────┘

                             │
                             ▼
    ┌──────────────────────────────┐
    │       ADMIN DASHBOARD         │
    │ (Filter → Review → Shortlist) │
    └──────────────────────────────┘
```

---

## 🚀 Module Dependencies

```
MODULE 1 (Auth)
└── No Dependencies

MODULE 2 (Interview Management)
└── Depends on: Module 1 (User Context)

MODULE 3 (Voice Interaction)
└── Depends on: Module 1 (User), Module 2 (Interview)

MODULE 4 (Feedback)
└── Depends on: Module 1 (User), Module 2 (Interview), Module 3 (Transcript)

MODULE 5 (Admin Dashboard)
└── Depends on: Module 1 (Admin User), Module 2 (Interview), Module 4 (Feedback)
```

---

## 📈 Data Flow Between Modules

```
Module 1 (Auth)
    │
    ├──► Creates User Record
    └──► Stores session
         │
         ▼
Module 2 (Interview Management)
    │
    ├──► Creates Interview
    ├──► Selects Questions (question bank)
    └──► Stores Interview Data
         │
         ▼
Module 3 (Voice Interaction)
    │
    ├──► Retrieves Interview & Questions
    ├──► Conducts AI Conversation
    ├──► Records Transcript
    └──► Stores Transcript
         │
         ▼
Module 4 (Feedback)
    │
    ├──► Retrieves Transcript
    ├──► Analyzes Performance (via Gemini)
    ├──► Produces Scores + Fitment Label
    └──► Stores Feedback

Module 5 (Admin)
    │
    └──► (Prototype) Displays seeded candidates dataset
```

---

## ✅ Module Completion Status

| Module | Name                 | Status       | Key Features                           |
| ------ | -------------------- | ------------ | -------------------------------------- |
| 1      | Authentication       | ✅ Complete  | Sign Up, Sign In, Session, Logout      |
| 2      | Interview Management | ✅ Complete  | Create, List, Generate, Delete         |
| 3      | Voice Interaction    | ✅ Complete  | Real-time Conversation, Transcription  |
| 4      | Feedback Analysis    | ✅ Complete  | Scoring, Analysis, PDF Export          |
| 5      | Admin Dashboard      | ✅ Prototype | Filters, Table, Flagged cases (seeded) |

---

## 🎯 Key Takeaways

✅ **Modular Architecture**: Each module has clear responsibility  
✅ **Scalable Design**: Easy to add new features to any module  
✅ **Separation of Concerns**: Frontend, API, and Service layers separated  
✅ **Database Driven**: Firestore for real-time data management  
✅ **AI-Powered**: Gemini for scoring + summaries, Vapi for voice, Sarvam for kn/hi/en STT/TTS  
✅ **Secure**: Firebase Auth + Session-based security  
✅ **Responsive**: TailwindCSS for mobile-friendly UI

---

## 📝 Files per Module

### Module 1 Files

- `app/(auth)/sign-in/page.tsx`
- `app/(auth)/sign-up/page.tsx`
- `components/AuthForm.tsx`
- `components/LogoutButton.tsx`
- `lib/actions/auth.action.ts`

### Module 2 Files

- `app/(root)/page.tsx`
- `app/(root)/interview/page.tsx`
- `app/(root)/interview/[id]/page.tsx`
- `components/CreateInterviewForm.tsx`
- `components/InterviewCard.tsx`
- `components/DeleteInterviewButton.tsx`
- `lib/actions/general.action.ts`
- `app/api/vapi/generate/route.ts`

### Module 3 Files

- `components/Agent.tsx`
- `components/SpeakingQualityPanel.tsx`
- `lib/vapi.sdk.ts`
- `app/api/vapi/extract-interview-fields/route.ts`
- `lib/sarvam.js`
- `hooks/useVideoInterview.js`

### Module 4 Files

- `app/(root)/interview/[id]/feedback/page.tsx`
- `app/(root)/interview/[id]/answers/page.tsx`
- `components/FeedbackModal.tsx`
- `components/FeedbackTabs.tsx`
- `components/DownloadFeedbackPDFButton.tsx`
- `components/SpeakingQualityDetailsPage.tsx`
- `lib/actions/general.action.ts` (createFeedback)

### Module 5 Files

- `app/(root)/admin/page.tsx`
- `app/(root)/admin/AdminDashboardClient.tsx`
- `constants/index.ts` (seededCandidates)
