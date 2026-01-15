import React from "react";

export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card shadow-xl bg-base-100 border border-black/10">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                {subtitle ? <p className="text-sm opacity-70 mt-1">{subtitle}</p> : null}
              </div>
              <div className="badge badge-outline border-black/20">Auth</div>
            </div>

            <div className="mt-4">{children}</div>

            {footer ? <div className="mt-4">{footer}</div> : null}
          </div>
        </div>

        <p className="text-xs opacity-60 text-center mt-4">
          Secure login • Email verification • Reset password
        </p>
      </div>
    </div>
  );
}
