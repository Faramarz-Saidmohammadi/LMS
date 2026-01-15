import React from "react";

export default function Field({ label, error, ...props }) {
  return (
    <label className="form-control w-full">
      <div className="label">
        <span className="label-text font-medium">{label}</span>
      </div>
      <input className={`input input-bordered w-full ${error ? "input-error" : ""}`} {...props} />
      {error ? (
        <div className="label">
          <span className="label-text-alt text-error">{error}</span>
        </div>
      ) : null}
    </label>
  );
}
