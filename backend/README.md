# Backend - MERN JWT Auth

This is the Express.js and MongoDB backend for the authentication system. It handles user registration, JWT session issuance, and OTP-based password resets via email.

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Create a `.env` file in the root of the `backend` directory and add the following variables:
   ```env
   PORT=3001
   MONGO_URI=your_mongodb_connection_string
   TOKEN_SECRET_KEY=your_random_jwt_secret_key
   GMAIL_USER=your_gmail_address
   GMAIL_PASS=your_gmail_app_password
   ```
   *(Note: Do not use your normal Gmail password. Generate a 16-character "App Password" from your Google Account security settings).*

3. **Start the server:**
   ```bash
   node index.js
   ```
   The backend API will start running on `http://localhost:3001`.
