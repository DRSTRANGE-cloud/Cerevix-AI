# Cerevix AI

## AI-Powered Career Intelligence Platform

Cerevix AI is a modern AI-driven interview preparation and career intelligence platform built using the MERN stack and Google Gemini AI.

The platform helps users:

* analyze resumes,
* prepare for interviews,
* identify skill gaps,
* simulate mock interviews,
* and track career preparation progress through analytics.

---

# Features

## ATS Resume Intelligence

* Resume vs Job Description analysis
* ATS score generation
* Skill gap detection
* Keyword matching
* Resume improvement suggestions
* AI-powered recommendations

---

## AI Interview Preparation

* Personalized technical interview questions
* Behavioral interview questions
* Skill-gap analysis
* Preparation roadmaps
* Match score generation

---

## AI Mock Interview Simulator

* AI-generated interview sessions
* Technical & behavioral interview modes
* Dynamic follow-up questions
* Final performance evaluation
* Communication & confidence scoring

---

## Career Analytics Dashboard

* ATS score trends
* Interview performance insights
* Weak skill analysis
* Progress tracking
* Activity timeline
* Reports history

---

## Resume PDF Generator

* AI-generated ATS-friendly resumes
* Puppeteer-based PDF rendering
* Downloadable optimized resumes

---

# Tech Stack

## Frontend

* React 19
* Vite
* React Router v7
* SCSS
* Context API
* Axios
* Recharts
* Framer Motion

---

## Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* Multer
* pdf-parse
* Puppeteer

---

## AI Integration

* Google Gemini AI
* Structured JSON responses
* Zod validation
* Prompt engineering

---

# Project Architecture

```bash
cerevix-ai/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── services/
│   │   └── styles/
│
├── backend/
│   ├── modules/
│   ├── services/
│   ├── middleware/
│   ├── models/
│   └── utils/
│
├── assets/
├── README.md
└── .env.example
```

---

# Core Workflow

```txt
Resume Upload
    ↓
PDF Parsing
    ↓
Gemini AI Analysis
    ↓
ATS + Interview Intelligence
    ↓
MongoDB Storage
    ↓
Analytics Dashboard
```

---

# Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/cerevix-ai.git
```

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## Backend Setup

```bash
cd backend
npm install
npm start
```

---

# Environment Variables

Create a `.env` file inside backend:

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
GEMINI_API_KEY=your_gemini_key
CLIENT_URL=http://localhost:5173
```

---

# Future Improvements

* Voice-based AI interviews
* Real-time AI streaming
* Coding interview workspace
* Resume version control
* AI career roadmap tracking
* Team collaboration
* Queue-based PDF generation
* Redis caching

---

# UI & Design

Cerevix AI uses:

* futuristic AI-inspired UI
* dark SaaS dashboard aesthetic
* responsive layouts
* glassmorphism effects
* animated interactions
* premium dashboard styling

Inspired by:

* Linear
* Vercel
* Notion
* OpenAI

---

# Security Features

* JWT Authentication
* Secure cookie sessions
* Rate limiting
* Helmet security
* Input validation
* File upload validation

---

# Why This Project?

Cerevix AI was built to simulate a real-world AI SaaS platform focused on interview intelligence, career growth, and scalable AI integration.

The project demonstrates:

* full-stack engineering,
* AI orchestration,
* scalable architecture,
* responsive frontend systems,
* backend optimization,
* and production-grade feature design.

---

# Author

Deepak Yadav

---

# License

This project is licensed under the MIT License.
