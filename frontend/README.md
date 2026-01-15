# LMS Frontend

A modern Learning Management System built with React, Vite, and Tailwind CSS.

## Features

- **Student Dashboard**: Browse courses, enroll, track progress, earn certificates
- **Collaborator Panel**: Create and manage courses, curriculum, submit for review
- **Admin Panel**: Manage invitations, review courses, publish content
- **Authentication**: Login, register, email verification, password reset
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **DaisyUI** - Component library
- **Zustand** - State management
- **React Router** - Routing
- **Axios** - HTTP client

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_WITH_CREDENTIALS=true
```

## Project Structure

```
src/
├── api/          # API calls and endpoints
├── components/   # Reusable components
├── layouts/      # Layout components
├── pages/        # Page components
├── routes/       # Routing configuration
├── stores/       # Zustand stores
├── utils/        # Utility functions
└── hooks/        # Custom hooks
```