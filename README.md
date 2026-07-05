# Smart Hostel Management System

Smart Hostel is a web-based hostel management system built with React, Flask, Firebase Authentication, and Firestore. It supports student registration, admin approval, room requests, maintenance requests, visitor requests, incident reports, payment tracking, staff management, and notifications.

## Tech Stack

- Frontend: React
- Backend: Flask
- Database: Firebase Firestore
- Authentication: Firebase Authentication
- Email Service: Gmail SMTP
- Styling: CSS

## Project Structure

```txt
SmartHostel-TT6L/
├── backend/
│   ├── app.py
│   ├── boot.py
│   ├── requirements.txt
│   ├── run_backend.bat
│   ├── .env.example
│   └── firebase/
│       └── serviceAccountKey.json
│
├── frontend/
│   ├── package.json
│   ├── run_frontend.bat
│   ├── .env.example
│   └── src/
│
└── README.md
```

## Features

- Student account registration
- Admin student approval and rejection
- Role-based login system
- Student dashboard
- Warden dashboard
- Maintenance staff dashboard
- Room request management
- Maintenance request management
- Visitor request management
- Incident report management
- Payment item and payment history management
- Staff account management
- Notification system
- Server logs page

## Backend Setup

Go to the backend folder:

```bash
cd backend
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file based on `.env.example`:

```env
SMTP_EMAIL=your-email@gmail.com
SMTP_APP_PASSWORD=your-gmail-app-password
```

Add your Firebase Admin SDK file here:

```txt
backend/firebase/serviceAccountKey.json
```

Run the backend:

```bash
python app.py
```

Or use:

```bash
run_backend.bat
```

Backend runs at:

```txt
http://127.0.0.1:5000
```

## Frontend Setup

Go to the frontend folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env.local` file based on `.env.example`:

```env
REACT_APP_FIREBASE_API_KEY=your-firebase-web-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

Start the frontend:

```bash
npm start
```

Or use:

```bash
run_frontend.bat
```

Frontend runs at:

```txt
http://localhost:3000
```

## Default Workflow

1. Student registers using a personal email.
2. Admin reviews pending students.
3. Admin approves the student account.
4. System generates a student email.
5. Student receives a password reset email.
6. Student logs in using the generated student email.
7. Student can submit room, maintenance, visitor, payment, and incident requests.
8. Warden, admin, and maintenance staff manage requests based on their roles.

## Build Frontend

```bash
cd frontend
npm run build
```

## Security Notes

The following files should not be uploaded to GitHub:

```txt
backend/.env
backend/firebase/serviceAccountKey.json
frontend/.env.local
frontend/node_modules/
frontend/build/
```

Use `.env.example` files to show required environment variables without exposing real secrets.

## GitHub Branch

Current working branch:

```txt
samson
```

## Author

Smart Hostel TT6L Project
