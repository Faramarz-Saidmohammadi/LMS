import React from "react";
import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="min-h-screen p-4">
      <Outlet />
    </div>
  );
}
