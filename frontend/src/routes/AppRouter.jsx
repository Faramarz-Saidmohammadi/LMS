import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";
import { GuestOnlyRoute, ProtectedRoute } from "./guards";

import Home from "../pages/Home.jsx";
import CourseCatalog from "../pages/CourseCatalog.jsx";
import CourseDetail from "../pages/CourseDetail.jsx";
import StudentDashboard from "../pages/StudentDashboard.jsx";
import StudentCourse from "../pages/StudentCourse.jsx";
import CollaboratorDashboard from "../pages/CollaboratorDashboard.jsx";
import CourseCreate from "../pages/CourseCreate.jsx";
import CourseEdit from "../pages/CourseEdit.jsx";
import AdminDashboard from "../pages/AdminDashboard.jsx";
import Certificate from "../pages/Certificate.jsx";
import Profile from "../pages/me/Profile.jsx";

import Login from "../pages/auth/Login.jsx";
import Register from "../pages/auth/Register.jsx";
import VerifyEmail from "../pages/auth/VerifyEmail.jsx";
import ForgotPassword from "../pages/auth/ForgotPassword.jsx";
import ResetPassword from "../pages/auth/ResetPassword.jsx";
import AcceptInvitation from "../pages/auth/AcceptInvitation.jsx";

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/courses", element: <CourseCatalog /> },
      { path: "/courses/:courseId", element: <CourseDetail /> },

      // ✅ Protected routes
      {
        element: <ProtectedRoute />,
        children: [
          { path: "/profile", element: <Profile /> },
          { path: "/dashboard", element: <StudentDashboard /> },
          { path: "/my-courses/:courseId", element: <StudentCourse /> },
          { path: "/collab/dashboard", element: <CollaboratorDashboard /> },
          { path: "/collab/courses/create", element: <CourseCreate /> },
          { path: "/collab/courses/:courseId/edit", element: <CourseEdit /> },
          { path: "/admin/dashboard", element: <AdminDashboard /> },
          { path: "/certificates/:enrollmentId", element: <Certificate /> },
        ],
      },
    ],
  },
  {
    element: <GuestOnlyRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: "/login", element: <Login /> },
          { path: "/register", element: <Register /> },
          { path: "/verify-email", element: <VerifyEmail /> },
          { path: "/forgot-password", element: <ForgotPassword /> },
          { path: "/reset-password", element: <ResetPassword /> },
          { path: "/accept-invitation", element: <AcceptInvitation /> },
        ],
      },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
