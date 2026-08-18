# Learning Management System

A full-stack learning platform for course publishing, enrollment, structured curriculum delivery, progress tracking, assessments, and administrative review workflows.

## Core capabilities

### Students
- Browse and search published courses
- Enroll and continue active courses
- Track lesson and curriculum progress
- Complete quizzes and assignments
- Receive certificates when completion requirements are met
- Submit course ratings and reviews

### Instructors
- Create and manage course drafts
- Organize curriculum into sections, articles, videos, and quizzes
- Submit courses for administrative review
- Revise content based on feedback
- Track course activity and learner engagement

### Administrators
- Manage invitations and user access
- Review, approve, reject, and publish courses
- Manage categories and platform content
- Monitor platform-level activity and analytics

## Architecture

The application is separated into an Express API and a React client.

### Backend
- Node.js and Express
- MongoDB with Mongoose
- JWT-based authentication
- bcryptjs password hashing
- Zod request validation
- Helmet and rate limiting
- Cloudinary media integration
- Nodemailer email delivery
- PDFKit certificate generation
- Swagger API documentation
- Jest and Supertest verification

### Frontend
- React 19
- Vite
- React Router
- Zustand
- Axios
- React Hook Form
- Tailwind CSS and DaisyUI

## Main application workflows

### Course publishing
1. An instructor creates a draft course.
2. Curriculum and course metadata are prepared.
3. The course is submitted for review.
4. An administrator reviews the submission and may provide feedback.
5. The instructor can revise rejected or returned content.
6. Approved content can be published for students.

### Student learning
1. A student browses published courses.
2. The student enrolls in a course.
3. Lessons and curriculum items are completed in sequence.
4. Progress is recorded as learning items are completed.
5. Quizzes and other assessments contribute to course completion.
6. Completion can result in certificate generation where configured.

## Project structure

```text
├── backend/
│   ├── controllers/     # Request handlers and application operations
│   ├── db/              # Database connection
│   ├── middleware/      # Authentication, authorization, validation, and HTTP middleware
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── test/            # Backend test suites
│   └── utils/           # Shared backend utilities
├── frontend/
│   ├── public/          # Static assets
│   └── src/
│       ├── api/         # API access helpers
│       ├── components/  # Reusable UI components
│       ├── layouts/     # Application layouts
│       ├── pages/       # Route-level screens
│       ├── routes/      # Client routing
│       ├── stores/      # Zustand stores
│       └── utils/       # Frontend utilities
├── .github/workflows/   # Continuous integration
├── CONTRIBUTING.md
└── SECURITY.md
```

## Local development

### Prerequisites
- Node.js 22
- npm
- MongoDB

### Backend

```bash
cd backend
npm ci
```

Create `backend/.env` with values appropriate for your environment:

```env
MONGO_URI=mongodb://localhost:27017/lms
JWT_SECRET=replace-with-a-strong-secret
CLIENT_URL=http://localhost:5173
PORT=5000

EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Start the API:

```bash
npm run dev
```

### Frontend

```bash
cd frontend
npm ci
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_WITH_CREDENTIALS=true
```

Start the client:

```bash
npm run dev
```

The local client is available at `http://localhost:5173` by default. API documentation is exposed at `/docs` by the backend when enabled.

## Quality checks

Backend:

```bash
cd backend
npm ci
npm test
npm audit --omit=dev --audit-level=high
```

Frontend:

```bash
cd frontend
npm ci
npm run lint
npm run build
npm audit --omit=dev --audit-level=high
```

The repository CI runs these checks for pull requests and changes to the default branch.

## Security

Keep credentials, cookie exports, access tokens, production data, and local environment files outside version control. Security-sensitive changes should be reviewed carefully, particularly authentication, authorization, uploads, course publication, email/account recovery, and dependency upgrades.

See `SECURITY.md` for reporting and repository-security expectations.

## Contributing

Development and review expectations are documented in `CONTRIBUTING.md`.
