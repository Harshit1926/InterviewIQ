---
title: InterviewIQ
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
---

# InterviewIQ

AI-powered mock interview platform built with Flask, RAG pipeline, FAISS, and Groq LLaMA 3.3 70B. Upload your resume and job description to get personalized interview questions, real-time evaluation, and a performance report.

**Try it live:** [huggingface.co/spaces/Harshit1926/InterviewIQ](https://huggingface.co/spaces/Harshit1926/InterviewIQ)

## Features
- Upload resume PDF and paste job description
- AI interviewer asks personalized questions via Groq Llama 3.3 70B
- RAG pipeline with FAISS for smart context retrieval
- Real-time chat interface
- Voice-based interview flow — questions are spoken aloud, and answers can be given by speaking (live transcription) or typing
- Live webcam preview for a more realistic interview feel
- Animated interviewer mascot that reacts when speaking, listening, or idle
- Performance evaluation with radar chart report

## Tech Stack
- **Backend** → Python, Flask, REST API
- **AI/ML** → Groq Llama 3.3 70B, LangChain, FAISS, Sentence-Transformers
- **Frontend** → HTML, CSS, JavaScript, Web Speech API (speech synthesis + recognition), WebRTC (webcam)
- **Deployment** → Hugging Face Spaces, Docker

## How to Run Locally
1. Clone the repo
2. Install dependencies: `pip install -r requirements.txt`
3. Create `.env` file from `.env.example` and add your Groq API key
4. Run: `python run.py`
5. Open `http://localhost:5000`

> Note: voice input/output and webcam preview require running over `localhost` or HTTPS, and a browser that supports the Web Speech API (Chrome/Edge recommended).