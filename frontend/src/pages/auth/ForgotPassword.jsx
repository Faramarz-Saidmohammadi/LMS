import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

import AuthCard from "../../components/auth/AuthCard";
import Field from "../../components/auth/Field";
import Alert from "../../components/common/Alert";

import { authApi } from "../../api/auth.api";
import { getHttpErrorMessage } from "../../utils/httpError";

export default function ForgotPassword() {
  const [msg, setMsg] = useState(null);
  const [errMsg, setErrMsg] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    setMsg(null);
    setErrMsg(null);

    try {
      const res = await authApi.forgotPassword({ email: data.email });
      setMsg(res?.data?.message || "If the email exists, a reset link has been sent.");
    } catch (e) {
      setErrMsg(getHttpErrorMessage(e));
    }
  };

  return (
    <AuthCard
      title="Forgot password"
      subtitle="We’ll email you a reset link"
      footer={
        <p className="text-sm opacity-70">
          Back to{" "}
          <Link className="link link-hover font-medium" to="/login">
            Login
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <Field
          label="Email"
          placeholder="you@example.com"
          error={errors?.email?.message}
          {...register("email", { required: "Email is required" })}
        />

        <button
          className="btn btn-primary w-full"
          disabled={isSubmitting}
          style={{ backgroundColor: "#E43636", borderColor: "#E43636" }}
        >
          {isSubmitting ? "Sending..." : "Send reset link"}
        </button>

        {msg ? <Alert type="success">{msg}</Alert> : null}
        {errMsg ? <Alert type="error">{errMsg}</Alert> : null}
      </form>
    </AuthCard>
  );
}
