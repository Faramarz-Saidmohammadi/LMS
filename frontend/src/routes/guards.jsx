import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export function GuestOnlyRoute() {
  const { isAuth } = useAuth();
  if (isAuth) return <Navigate to="/" replace />;
  return <Outlet />;
}

export function ProtectedRoute() {
  const { isAuth } = useAuth();
  if (!isAuth) return <Navigate to="/login" replace />;
  return <Outlet />;
}
