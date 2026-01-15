import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";

import AuthCard from "../../components/auth/AuthCard";
import Field from "../../components/auth/Field";
import Alert from "../../components/common/Alert";

import { authApi } from "../../api/auth.api";
import { getHttpErrorMessage } from "../../utils/httpError";

export default function ResetPassword() {
  const [sp] = useSearchParams();
  const token = useMemo(() => sp.get("token") || "", [sp]);

  const [msg, setMsg] = useState(null);
  const [errMsg, setErrMsg] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm();

  const onSubmit = async (data) => {
    setMsg(null);
    setErrMsg(null);

    try {
      const res = await authApi.resetPassword({
        token,
        newPassword: data.newPassword,
      });
      setMsg(res?.data?.message || "Password reset successful. You can now login.");
    } catch (e) {
      setErrMsg(getHttpErrorMessage(e));
    }
  };

  return (
    <AuthCard
      title="Reset password"
      subtitle="Set a new password (min 8 chars)"
      footer={
        <p className="text-sm opacity-70">
          Back to{" "}
          <Link className="link link-hover font-medium" to="/login">
            Login
          </Link>
        </p>
      }
    >
      {!token ? (
        <Alert type="error">
          Token not found. Please open the reset link from your email.
        </Alert>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Field
            label="New password"
            type="password"
            placeholder="min 8 chars"
            error={errors?.newPassword?.message}
            {...register("newPassword", {
              required: "New password is required",
              minLength: { value: 8, message: "Min 8 characters" },
              maxLength: { value: 72, message: "Max 72 characters" },
            })}
          />

          <Field
            label="Confirm password"
            type="password"
            placeholder="repeat password"
            error={errors?.confirmPassword?.message}
            {...register("confirmPassword", {
              required: "Confirm password is required",
              validate: (v) => v === watch("newPassword") || "Passwords do not match",
            })}
          />

          <button
            className="btn btn-primary w-full"
            disabled={isSubmitting}
            style={{ backgroundColor: "#E43636", borderColor: "#E43636" }}
          >
            {isSubmitting ? "Saving..." : "Reset password"}
          </button>

          {msg ? <Alert type="success">{msg}</Alert> : null}
          {errMsg ? <Alert type="error">{errMsg}</Alert> : null}
        </form>
      )}
    </AuthCard>
  );
}
