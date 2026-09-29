# 🎯 Cloud-Based Hobby Tracker

A modern **cloud-based hobby tracking application** built using **React.js and Firebase**. The application allows users to add, manage, and track their hobbies while storing their data securely in the cloud.

The project demonstrates the practical use of **cloud computing, authentication, and cloud database services** to build a personalized web application.

---

## 📌 Project Overview

People often have multiple hobbies but may find it difficult to consistently track their activities and progress.

The **Cloud-Based Hobby Tracker** provides a simple platform where users can maintain their hobbies in one place, track their progress, and manage their personal hobby information.

The application uses **Firebase Authentication** for user login and **Cloud Firestore** for storing hobby data in the cloud.

---

## ✨ Features

### 🔐 User Authentication

* User registration
* User login
* User logout
* Firebase Authentication
* User-specific hobby data

### 🎯 Hobby Management

Users can:

* Add new hobbies
* View their hobbies
* Edit hobby information
* Delete hobbies
* Track hobby progress
* Manage multiple hobbies

### 📊 Hobby Tracking

Each hobby can contain information such as:

* Hobby name
* Category
* Description
* Goal
* Progress
* Frequency
* Status

### ☁️ Cloud Database

Hobby information is stored in **Firebase Cloud Firestore**, allowing the data to remain available across sessions.

### 👤 Personalized Dashboard

Each authenticated user gets a personalized dashboard containing their own hobby information.

### 📱 Responsive Interface

The application is designed for:

* Desktop
* Laptop
* Tablet
* Mobile devices

---

# 🛠️ Technologies Used

| Technology              | Purpose                 |
| ----------------------- | ----------------------- |
| React.js                | Frontend development    |
| Vite                    | Development environment |
| JavaScript              | Application logic       |
| Firebase Authentication | User authentication     |
| Cloud Firestore         | Cloud database          |
| HTML5                   | Application structure   |
| CSS3                    | User interface          |
| Git                     | Version control         |
| GitHub                  | Project hosting         |

---

# ☁️ Cloud Architecture

```text
                    ┌──────────────────┐
                    │       User       │
                    │ Web Browser      │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   React + Vite   │
                    │    Frontend      │
                    └────────┬─────────┘
                             │
                 ┌───────────┴───────────┐
                 │                       │
                 ▼                       ▼
        ┌─────────────────┐     ┌──────────────────┐
        │ Firebase Auth   │     │ Cloud Firestore  │
        │                 │     │                  │
        │ Login/Register  │     │ Hobby Data       │
        │ User Sessions   │     │ User Profiles    │
        └─────────────────┘     └──────────────────┘
```

---

# 📂 Project Structure

```text
cloud-hobby-tracker/
│
├── public/
│
├── src/
│   ├── assets/
│   ├── App.jsx
│   ├── App.css
│   ├── firebase.js
│   └── main.jsx
│
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
└── README.md
```

---

# ⚙️ Installation

## 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/cloud-hobby-tracker.git
```

Navigate to the project:

```bash
cd cloud-hobby-tracker
```

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Start the development server

```bash
npm run dev
```

The application will be available at a local URL similar to:

```text
http://localhost:5173/
```

Open the URL in your browser.

---

# 🔥 Firebase Setup

## Step 1 — Create Firebase Project

Open the Firebase Console and create a new project.

Enable the following services:

```text
Firebase Authentication
Cloud Firestore
```

This project does **not require Firebase Storage**.

---

## Step 2 — Enable Authentication

Go to:

```text
Firebase Console
        ↓
Authentication
        ↓
Sign-in method
        ↓
Email/Password
```

Enable **Email/Password authentication**.

---

## Step 3 — Create Firestore Database

Go to:

```text
Firebase Console
        ↓
Firestore Database
        ↓
Create Database
```

Create the Firestore database.

---

## Step 4 — Register Web Application

Go to:

```text
Project Settings
        ↓
Your Apps
        ↓
Web App
```

Register your React application.

Firebase provides configuration values such as:

```text
apiKey
authDomain
projectId
storageBucket
messagingSenderId
appId
```

Add the required Firebase configuration to your `firebase.js` file.

---

# 🗄️ Firestore Database Structure

A simple structure can be used for storing user hobby information.

```text
users
 └── userId
      ├── name
      └── email

hobbies
 └── hobbyId
      ├── userId
      ├── name
      ├── category
      ├── description
      ├── goal
      ├── frequency
      ├── progress
      ├── status
      └── createdAt
```

---

# 🔄 Application Workflow

```text
                  START
                    │
                    ▼
              Create Account
                    │
                    ▼
                  Login
                    │
                    ▼
             Hobby Dashboard
                    │
          ┌─────────┼─────────┐
          │         │         │
          ▼         ▼         ▼
        Add       Edit      Delete
       Hobby      Hobby      Hobby
          │         │         │
          └─────────┼─────────┘
                    ▼
             Cloud Firestore
                    │
                    ▼
              Updated Data
```

---

# 🎯 Core Functionality

## Add Hobby

Users can create a new hobby by entering information such as:

```text
Hobby Name
Category
Description
Goal
Frequency
Progress
Status
```

The information is stored in Cloud Firestore.

---

## View Hobbies

The dashboard retrieves the authenticated user's hobbies from Firestore and displays them in an easy-to-use interface.

---

## Edit Hobby

Users can update their hobby details whenever required.

---

## Delete Hobby

Users can remove hobbies that they no longer want to track.

---

## Track Progress

Users can update their progress to monitor their development over time.

Example:

```text
Photography
Progress: 70%
Status: In Progress
```

---

# 📊 Example Hobby Categories

The application can support categories such as:

* 🎨 Art
* 📷 Photography
* 🎵 Music
* 📚 Reading
* 🏃 Fitness
* 💻 Coding
* 🌱 Gardening
* ✍️ Writing
* 🍳 Cooking
* 🎮 Gaming
* 🧘 Meditation
* 🎬 Video Editing

---

# 🔐 Security

Firebase Authentication is used to authenticate users.

Firestore data should be protected using appropriate **Firestore Security Rules** so users can access and modify only the data they are authorized to use.

For example, hobby records can be associated with the authenticated user's UID.

---

# 🧠 Learning Objectives

This project helps demonstrate practical knowledge of:

* Cloud computing
* Firebase services
* Firebase Authentication
* Cloud Firestore
* CRUD operations
* React.js
* JavaScript
* User authentication
* Cloud database integration
* User-specific data management
* Responsive web development
* Git and GitHub

---

# 🚀 Future Enhancements

The project can be expanded with:

* 📈 Hobby progress analytics
* 📅 Daily hobby tracking
* 🔥 Streak tracking
* ⏰ Hobby reminders
* 🏆 Achievement badges
* 📊 Progress charts
* 🎯 Personal goals
* 🔔 Notifications
* 🌙 Dark mode
* 🔍 Search and filtering
* 📱 Progressive Web App support
* 🌐 Firebase Hosting deployment

---

# 📸 Screenshots

Recommended screenshots for the GitHub repository:

<img width="1366" height="768" alt="Screenshot 2026-09-29 173323" src="https://github.com/user-attachments/assets/a9d74e95-6de5-4b67-9982-affde08008ac" />
<img width="1366" height="768" alt="Screenshot 2026-09-29 173621" src="https://github.com/user-attachments/assets/4ac4cac4-4954-426e-af70-6ea345c4d02b" />

<img width="1366" height="768" alt="Screenshot 2026-09-29 174155" src="https://github.com/user-attachments/assets/fb339c5e-ced1-400f-b699-8423acc9876f" />
<img width="1366" height="768" alt="Screenshot 2026-09-29 173649" src="https://github.com/user-attachments/assets/13d0572e-1943-431c-b485-a5e0a66c06a2" />
<img width="1366" height="768" alt="Screenshot 2026-09-29 174207" src="https://github.com/user-attachments/assets/5f0cf206-9940-4341-9d1c-32709bcd4392" />

<img width="1366" height="768" alt="Screenshot 2026-09-28 215548" src="https://github.com/user-attachments/assets/dfbabad6-44ce-4050-9c77-9ba65abeabb1" />

Add them to the README using:

```markdown
![Login Page](screenshots/login.png)

![Hobby Dashboard](screenshots/dashboard.png)

![Add Hobby](screenshots/add-hobby.png)
```

---

# 💻 Available Commands

Start development server:

```bash
npm run dev
```

Create production build:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

---

# 🌐 Deployment

The application can be deployed using:

* Firebase Hosting
* Vercel
* Netlify

The project can later be connected to a custom domain.

---

# 👩‍💻 Author

**Your Name**

B.Tech — Electronics and Computer Engineering

GitHub:
`https://github.com/YOUR-USERNAME`

LinkedIn:
`https://linkedin.com/in/YOUR-PROFILE`

---

# ⭐ Project Highlights

```text
☁️ Cloud-Based Application
🔐 Firebase Authentication
🗄️ Cloud Firestore
🎯 Hobby Management
📊 Progress Tracking
👤 Personalized Dashboard
⚛️ React.js
📱 Responsive UI
🚀 Deployment Ready
```

---

## 📄 License

This project is developed for **educational and portfolio purposes**.
