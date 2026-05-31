<div align="center">

<img src="C:\Users\Yadav\OneDrive\Desktop\Desktop\Web Development\Projects\Interview-ai\Frontend\public\cerevix-logo.png" width="60" alt="Cerevix AI Logo" />

# Cerevix AI

**AI-powered interview preparation platform for serious job seekers.**

[Live Demo](https://cerevix-ai.vercel.app) · [Report Bug](https://github.com/DRSTRANGE-cloud/Cerevix-AI/issues) · [Request Feature](https://github.com/DRSTRANGE-cloud/Cerevix-AI/issues)

![React](https://img.shields.io/badge/React_19-20232A?style=flat&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat&logo=mongodb&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Gemini_AI-4285F4?style=flat&logo=google&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)

</div>

---

## What is Cerevix AI?

Cerevix AI helps you land your next job by combining resume intelligence, AI mock interviews, and career analytics into one platform. Upload your resume, paste a job description, and get a full picture of where you stand — and how to improve.

**Live at → [cerevix-ai.vercel.app](https://cerevix-ai.vercel.app)**

---

## Features

### 📄 ATS Resume Analysis

Upload your resume and get an instant ATS score, keyword gap analysis, and AI-powered suggestions to match any job description.

### 🤖 AI Mock Interviews

Simulate real interviews with AI-generated technical and behavioral questions, follow-ups, and performance feedback powered by Google Gemini.

### 📊 Career Analytics

Track your ATS score trends, interview performance, and skill gaps over time through a visual analytics dashboard.

### 📥 Resume PDF Generator

Generate a polished, ATS-friendly resume as a downloadable PDF — built and rendered with Puppeteer.

---

## Tech Stack

| Layer          | Technology                                    |
| -------------- | --------------------------------------------- |
| Frontend       | React 19, Vite, SCSS, Framer Motion, Recharts |
| Backend        | Node.js, Express.js, MongoDB, JWT             |
| AI             | Google Gemini AI, Zod, Prompt Engineering     |
| Infrastructure | Vercel (frontend), Render (backend)           |

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB URI
- Google Gemini API key

### 1. Clone the repo

```bash
git clone https://github.com/DRSTRANGE-cloud/Cerevix-AI.git
cd Cerevix-AI
```

### 2. Setup the backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder:

```env
PORT=3000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
GOOGLE_GENAI_API_KEY=your_gemini_api_key
NODE_ENV=development
```

```bash
npm start
```

### 3. Setup the frontend

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` folder:

```env
VITE_API_URL=http://localhost:3000
```

```bash
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## Project Structure

```
cerevix-ai/
├── frontend/               # React + Vite app
│   ├── src/
│   │   ├── features/       # Auth, Interview, ATS, Analytics
│   │   ├── lib/            # Axios client
│   │   └── components/     # Shared UI components
│
├── backend/                # Express API
│   ├── src/
│   │   ├── modules/        # Interview, ATS, Mock Interview, Analytics
│   │   ├── middlewares/    # Auth, Error, Sanitize
│   │   └── config/         # DB, Env, Cookie options
│
└── README.md
```

---

## Deployment

| Service  | Platform      | URL                                                    |
| -------- | ------------- | ------------------------------------------------------ |
| Frontend | Vercel        | [cerevix-ai.vercel.app](https://cerevix-ai.vercel.app) |
| Backend  | Render        | cerevix-ai.onrender.com                                |
| Database | MongoDB Atlas | —                                                      |

---

## Author

**Deepak Yadav** — Full-stack developer building AI-powered products.

[GitHub](https://github.com/DRSTRANGE-cloud) · [LinkedIn](https://linkedin.com/in/your-profile)

---

## License

MIT License — feel free to use this project as a reference or starting point.

---

<div align="center">
  <strong>Cerevix AI — Prepare Smarter. Interview Better.</strong>
</div>
