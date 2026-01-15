import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import AuthCard from "../../components/auth/AuthCard";
import Field from "../../components/auth/Field";
import Alert from "../../components/common/Alert";

import { authApi } from "../../api/auth.api";
import { getHttpErrorMessage } from "../../utils/httpError";
import useAuth from "../../hooks/useAuth";

export default function Register() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();

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
      const res = await authApi.register(data);

      // بک‌اند: {message, token, user}
      const user = res?.data?.user || res?.data;
      setAuth(user);

      setMsg("Registered successfully ✅");
      setTimeout(() => navigate("/verify-email", { replace: true }), 600);
    } catch (e) {
      setErrMsg(getHttpErrorMessage(e));
    }
  };

  return (
    <AuthCard
      title="Create account"
      subtitle="Register and then verify your email"
      footer={
        <p className="text-sm opacity-70">
          Already have an account?{" "}
          <Link className="link link-hover font-medium" to="/login">
            Login
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <Field
          label="Full name"
          placeholder="e.g. Mohammad"
          error={errors?.name?.message}
          {...register("name", { required: "Name is required" })}
        />

        <Field
          label="Email"
          placeholder="you@example.com"
          error={errors?.email?.message}
          {...register("email", { required: "Email is required" })}
        />

        <Field
          label="Password"
          type="password"
          placeholder="min 6 chars"
          error={errors?.password?.message}
          {...register("password", {
            required: "Password is required",
            minLength: { value: 6, message: "Min 6 characters" },
          })}
        />

        <button
          className="btn btn-primary w-full"
          disabled={isSubmitting}
          style={{ backgroundColor: "#E43636", borderColor: "#E43636" }}
        >
          {isSubmitting ? "Creating..." : "Register"}
        </button>

        {msg ? <Alert type="success">{msg}</Alert> : null}
        {errMsg ? <Alert type="error">{errMsg}</Alert> : null}
      </form>
    </AuthCard>
  );
}
