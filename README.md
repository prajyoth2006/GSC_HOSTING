# 🌍 VolunMatch: AI-Driven Volunteer Allocation Ecosystem  
### Google Solution Challenge 2026 Submission  

![GSC 2026](https://img.shields.io/badge/Google_Solution_Challenge-2026-blue?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-MERN%20%7C%20Flutter-success?style=for-the-badge)
![AI](https://img.shields.io/badge/AI-Google_Gemini-orange?style=for-the-badge)

---

## 🚀 Live Demo

🌐 **Web Dashboard:** https://gsc-hosting.vercel.app/  

📱 **Android App:** Available in the repository Releases section  

---

## 📖 Overview

**VolunMatch** is an AI-powered volunteer allocation platform designed to maximize social impact by intelligently matching community needs with the right people.

Built for **Google Solution Challenge 2026**, the platform bridges the gap between **problem identification** and **efficient execution** using:

- 🤖 **Gemini AI** for intelligent decision-making  
- 📍 **Geospatial matching** for location-based allocation  
- ⚡ **Real-time synchronization** across all users  

---

## 🎯 Problem Statement

Communities often face delays in addressing local issues due to:
- Poor coordination between volunteers and administrators  
- Lack of skill-based task allocation  
- Inefficient communication systems  

---

## 💡 Solution

VolunMatch introduces an **AI-driven ecosystem** where:

- Field workers report real-world problems instantly  
- Admins get smart volunteer recommendations  
- Volunteers receive tasks aligned with their skills and location  

---

## 🔄 System Workflow

1. 📸 **Task Creation**  
   Field worker captures issue (photo + description + location)

2. 📊 **Admin Dashboard Sync**  
   Task appears instantly on web dashboard  

3. 🧠 **AI Matching (Gemini)**  
   Suggests best-fit volunteers based on:
   - Skills  
   - Distance  
   - Availability  

4. 📤 **Assignment**  
   Admin assigns task  

5. ✅ **Completion**  
   Volunteer resolves and updates status  

---

## ✨ Key Features

### 💻 Admin Dashboard
- Real-time analytics  
- AI + manual assignment system  
- Advanced filtering (skills, location, availability)  

### 📱 Field Worker App
- Instant task creation via image capture  
- Automatic GPS tagging  

### 🏃 Volunteer App
- Personalized task feed  
- Distance-based navigation  

### 🧠 AI Engine
- Powered by Google Gemini  
- Smart recommendation system  

---

## 🛠️ Tech Stack

### Frontend
- React.js  
- Tailwind CSS  
- Hosted on Vercel  

### Mobile
- Flutter (Cross-platform)  

### Backend
- Node.js  
- Express.js  
- JWT Authentication  
- Hosted on Render  

### Database & AI
- MongoDB Atlas  
- Google Gemini API  

---

## 🚀 Getting Started

### 🔧 Prerequisites
- Node.js (v16+)  
- Flutter SDK (v3+)  

---

### 📦 Installation

```bash
git clone https://github.com/your-username/volunmatch.git
cd volunmatch


⚙️ Backend Setup

cd Backend
npm install

Create a .env file using .env.sample:

PORT=8000
MONGODB_URI=your_mongodb_uri
CORS_ORIGIN=https://gsc-hosting.vercel.app
ACCESS_TOKEN_SECRET=your_secret
REFRESH_TOKEN_SECRET=your_secret
ADMIN_REGISTRATION_KEY=your_admin_key
GEMINI_API_KEY=your_api_key

Run backend: npm run start:backend

🌐 Frontend Setup

cd Frontend
npm install
npm run start:frontend

🧪 Test Credentials :

👨‍💼 Admin
Email: alex@admin2.com
Password: password123
Admin Key: super_secret_admin_key_123

🙋 Volunteer
Email: arjun2@volunteer.com
Password: password123

👷 Field Worker
Email: bob@worker.com
Password: password123

🌍 Impact
VolunMatch enables:
Faster response to community issues
Efficient use of human resources
Scalable volunteer coordination system

👨‍💻 Developer
Mantri Prajyoth
Indian Institute of Technology (IIT) Patna
🏆 Google Solution Challenge 2026
Built with the vision of leveraging technology for real-world social impact 
