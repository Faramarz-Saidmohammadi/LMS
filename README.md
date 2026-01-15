# Learning Management System (LMS)

A comprehensive Learning Management System built with the MERN stack (MongoDB, Express, React, Node.js).

## Features

### For Students
- Browse and search courses
- Enroll in courses
- Track learning progress
- Complete quizzes and assignments
- Earn certificates upon completion
- Leave reviews and ratings

### For Collaborators (Instructors)
- Create and manage courses
- Build curriculum with articles, videos, and quizzes
- Submit courses for admin review
- Track course performance and student engagement
- Update course content (with approval workflow)

### For Admins
- Manage user invitations
- Review and approve/reject courses
- Publish approved courses
- Monitor platform analytics
- Manage categories and content

## Tech Stack

### Backend
- **Node.js** & **Express** - Server framework
- **MongoDB** & **Mongoose** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Cloudinary** - Media storage
- **PDFKit** - Certificate generation
- **Nodemailer** - Email sending

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **DaisyUI** - Component library
- **Zustand** - State management
- **React Router** - Routing
- **Axios** - HTTP client

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd lms
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

4. Set up environment variables:

   **Backend (.env)**:
   ```env
   MONGO_URI=mongodb://localhost:27017/lms
   JWT_SECRET=your-jwt-secret
   CLIENT_URL=http://localhost:5173
   PORT=5000

   # Email configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password

   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

   **Frontend (.env)**:
   ```env
   VITE_API_BASE_URL=http://localhost:5000
   VITE_WITH_CREDENTIALS=true
   ```

5. Start MongoDB service

6. Start the backend:
   ```bash
   cd backend
   npm run dev
   ```

7. Start the frontend (in a new terminal):
   ```bash
   cd frontend
   npm run dev
   ```

8. Open [http://localhost:5173](http://localhost:5173) in your browser

## API Documentation

The API documentation is available via Swagger at `/docs` when the backend is running.

## Project Structure

```
├── backend/
│   ├── controllers/     # Route handlers
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API routes
│   ├── middleware/     # Express middleware
│   ├── utils/          # Utility functions
│   ├── db/            # Database connection
│   └── tests/         # Test files
├── frontend/
│   ├── src/
│   │   ├── api/       # API calls
│   │   ├── components/# Reusable components
│   │   ├── layouts/   # Layout components
│   │   ├── pages/     # Page components
│   │   ├── routes/    # Routing config
│   │   ├── stores/    # Zustand stores
│   │   └── utils/     # Utilities
│   └── public/        # Static assets
└── README.md
```

## Key Workflows

### Course Creation Workflow
1. Collaborator creates course (draft)
2. Adds curriculum (sections, items)
3. Submits for review
4. Admin reviews and provides feedback
5. Collaborator revises if needed
6. Admin approves and publishes
7. Course becomes available to students

### Student Learning Workflow
1. Browse published courses
2. Enroll in courses
3. Complete curriculum items
4. Take quizzes
5. Track progress
6. Earn certificate upon completion

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.