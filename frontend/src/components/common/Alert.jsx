import React from "react";

export default function Alert({ type = "info", children }) {
  const cls =
    type === "error"
      ? "alert-error"
      : type === "success"
      ? "alert-success"
      : type === "warning"
      ? "alert-warning"
      : "alert-info";

  return <div className={`alert ${cls} mt-3`}>{children}</div>;
}
