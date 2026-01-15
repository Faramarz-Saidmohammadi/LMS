import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

import AuthCard from "../../components/auth/AuthCard";
import Field from "../../components/auth/Field";
import Alert from "../../components/common/Alert";

import { authApi } from "../../api/auth.api";
import { getHttpErrorMessage } from "../../utils/httpError";
import useAuth from "../../hooks/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const [errMsg, setErrMsg] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    setErrMsg(null);
    try {
      const res = await authApi.login(data);
      const user = res?.data?.user || res?.data;
      setAuth(user);

      navigate("/", { replace: true });
    } catch (e) {
      setErrMsg(getHttpErrorMessage(e));
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Login with your email & password"
      footer={
        <div className="flex items-center justify-between text-sm opacity-70">
          <Link className="link link-hover" to="/forgot-password">
            Forgot password?
          </Link>
          <Link className="link link-hover font-medium" to="/register">
            Create account
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <Field
          label="Email"
          placeholder="you@example.com"
          error={errors?.email?.message}
          {...register("email", { required: "Email is required" })}
        />

        <Field
          label="Password"
          type="password"
          placeholder="your password"
          error={errors?.password?.message}
          {...register("password", { required: "Password is required" })}
        />

        <button
          className="btn btn-primary w-full"
          disabled={isSubmitting}
          style={{ backgroundColor: "#E43636", borderColor: "#E43636" }}
        >
          {isSubmitting ? "Signing in..." : "Login"}
        </button>

        {errMsg ? <Alert type="error">{errMsg}</Alert> : null}

        <div className="divider">OR</div>

        <Link className="btn btn-outline w-full" to="/verify-email">
          Verify Email
        </Link>
      </form>
    </AuthCard>
  );
}
