# 🚀 EventHub – Backend API  
### Secure REST API for Online Event Management Platform

<p align="center">
  <strong>Role-Based • Secure • Scalable • Production-Ready</strong><br/>
  Built with Node.js, Express & Supabase
</p>

---

## 📖 Project Overview

EventHub Backend is a secure RESTful API built using **Node.js and Express**.  

It handles:

- Authentication verification
- Role-based authorization
- Event management
- Session assignment
- Poll system
- Feedback system
- Q&A management
- Ticket generation
- Admin analytics
- Password reset functionality

The backend connects securely to **Supabase** for database and authentication services and is deployed on **Render**.

---

## 🌐 Live Deployment

🚏 **Backend API (Render):**  
https://online-event-management-backend-85md.onrender.com  

🌍 **Connected Frontend (Netlify):**  
https://jade-jalebi-b3bfec.netlify.app  

---

## 🛠 Tech Stack

**Runtime & Framework**
- Node.js
- Express.js

**Database & Authentication**
- Supabase (PostgreSQL)
- Supabase Auth

**Email Service**
- Nodemailer 

**Security & Utilities**
- dotenv
- CORS
- Role-based middleware

**Deployment**
- Render

---

## 🔐 Authentication & Security

- Token-based authentication
- Supabase session verification
- Role-based access control (Admin / Speaker / Attendee)
- Protected middleware routes
- Secure environment variables

---

## 📡 API Documentation

### 🔑 Authentication Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
POST | `/api/auth/signup` | Create new user |
POST | `/api/auth/login` | Login with email & password |
POST | `/api/auth/forgot-password` | Send password reset email |
GET  | `/api/profile` | Get logged-in user role |

---

### 🎟 Event Routes

| Method | Endpoint | Access |
|--------|----------|--------|
GET | `/api/events` | Public |
GET | `/api/events/:id` | Public |
POST | `/api/admin/events` | Admin |
PUT | `/api/admin/events/:id` | Admin |
DELETE | `/api/admin/events/:id` | Admin |

---

### 👑 Dashboard Routes

| Route | Role |
|-------|------|
GET `/api/dashboard/user` | Attendee |
GET `/api/dashboard/speaker` | Speaker |
GET `/api/dashboard/admin` | Admin |

---

### 🎤 Session Management

- Assign session to speaker
- Update session
- Delete session
- Fetch sessions per speaker

---

### 🗳 Poll System

- Create poll (Admin)
- Update poll (Admin)
- Delete poll (Admin)
- Vote on poll (User)
- Fetch polls (Role-based)

---

### 📝 Feedback System

- Submit event feedback (User)
- View feedback (Admin)

---

### 💬 Q&A Module

- Create Q&A (Admin / Speaker)
- Delete Q&A
- Fetch Q&A

---

### 📊 Admin Analytics

Endpoint:
```
GET /api/admin/analytics
```

Returns:
- Total events
- Total registrations
- Total feedback
- Event popularity
- Category distribution
- Rating breakdown
- Monthly trends

---

## 🗄 Database Schema Overview

### 🧑 Profiles
- id
- name
- role (admin / speaker / attendee)
- approved

### 📅 Events
- id
- title
- description
- category
- location
- date
- price
- speaker_id

### 🎤 Sessions
- id
- event_id
- speaker_id
- meeting_url
- start_time
- end_time

### 📝 Registrations
- user_id
- event_id
- name
- email
- phone

### 🎟 Tickets
- user_id
- event_id
- ticket_code
- status

### 🗳 Polls
- question
- event_id
- options
- votes

### ⭐ Feedback
- overall_rating
- content_rating
- speaker_rating
- comment

---

## ⚙️ Local Development Setup

### 1️⃣ Clone Repository
```bash
git clone <your-backend-repo-link>
cd backend-folder
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Create `.env` File

```env
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
EMAIL_USER=your_email
EMAIL_PASS=your_email_app_password
FRONTEND_URL=http://localhost:5173
```

⚠️ Never expose SERVICE_ROLE_KEY publicly.

### 4️⃣ Start Server
```bash
node server.js
```

Server runs on:
```
http://localhost:5000
```

---

## 🔄 Architecture Flow

```
User → React Frontend → Express Backend → Supabase Database
```

Authentication Flow:

```
User → Login / Google OAuth → Token Generated → Backend Verification → Role-Based Access
```

---

## 📌 Deployment Requirements

✔ Backend deployed on Render  
✔ Frontend deployed on Netlify  
✔ Environment variables configured in Render  
✔ Backend integrated with deployed frontend URL  

---

## 🎯 Project Highlights

- Secure Role-Based API
- Supabase Integration
- Password Reset Functionality
- Admin Analytics Engine
- Modular Route Structure
- Production Deployment Ready

---

### 👨‍💻 Developed as part of Full Stack Web Application Project