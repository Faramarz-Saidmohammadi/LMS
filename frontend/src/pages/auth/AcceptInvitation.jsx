import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import AuthCard from "../../components/auth/AuthCard";
import Field from "../../components/auth/Field";
import Alert from "../../components/common/Alert";

import { authApi } from "../../api/auth.api";
import { getHttpErrorMessage } from "../../utils/httpError";

export default function AcceptInvitation() {
  const [sp] = useSearchParams();
  const token = useMemo(() => sp.get("token") || "", [sp]);
  const navigate = useNavigate();

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
      const res = await authApi.acceptInvitation({
        token,
        name: data.name,
        password: data.password,
      });

      setMsg(res?.data?.message || "Account created. Verification code sent to email.");
      setTimeout(() => navigate("/verify-email", { replace: true }), 800);
    } catch (e) {
      setErrMsg(getHttpErrorMessage(e));
    }
  };

  return (
    <AuthCard
      title="Accept invitation"
      subtitle="Create your collaborator account"
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
          Invitation token not found. Please open the invitation link from email.
        </Alert>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Field
            label="Full name"
            placeholder="Your name"
            error={errors?.name?.message}
            {...register("name", { required: "Name is required" })}
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
            {isSubmitting ? "Creating..." : "Accept & Create account"}
          </button>

          {msg ? <Alert type="success">{msg}</Alert> : null}
          {errMsg ? <Alert type="error">{errMsg}</Alert> : null}
        </form>
      )}
    </AuthCard>
  );
}
