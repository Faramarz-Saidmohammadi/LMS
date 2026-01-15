import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

import AuthCard from "../../components/auth/AuthCard";
import Field from "../../components/auth/Field";
import OTPInput from "../../components/auth/OTPInput";
import Alert from "../../components/common/Alert";

import { authApi } from "../../api/auth.api";
import { getHttpErrorMessage } from "../../utils/httpError";

export default function VerifyEmail() {
  const [step, setStep] = useState(1); // 1: send code, 2: verify
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const [msg, setMsg] = useState(null);
  const [errMsg, setErrMsg] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const sendCode = async (data) => {
    setMsg(null);
    setErrMsg(null);

    try {
      await authApi.sendVerifyCode({ email: data.email });
      setEmail(data.email);
      setStep(2);
      setMsg("Verification code sent ✅ (check your email)");
    } catch (e) {
      setErrMsg(getHttpErrorMessage(e));
    }
  };

  const verify = async () => {
    setMsg(null);
    setErrMsg(null);

    try {
      await authApi.verifyEmail({ email, code });
      setMsg("Email verified successfully ✅");
    } catch (e) {
      setErrMsg(getHttpErrorMessage(e));
    }
  };

  return (
    <AuthCard
      title="Verify your email"
      subtitle="Send code and confirm it"
      footer={
        <p className="text-sm opacity-70">
          Back to{" "}
          <Link className="link link-hover font-medium" to="/login">
            Login
          </Link>
        </p>
      }
    >
      {step === 1 ? (
        <form onSubmit={handleSubmit(sendCode)} className="space-y-3">
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
            {isSubmitting ? "Sending..." : "Send verification code"}
          </button>

          {msg ? <Alert type="success">{msg}</Alert> : null}
          {errMsg ? <Alert type="error">{errMsg}</Alert> : null}
        </form>
      ) : (
        <div className="space-y-3">
          <div className="p-3 rounded-xl border border-black/10 bg-base-200">
            <p className="text-sm opacity-70">Code sent to:</p>
            <p className="font-semibold">{email}</p>
          </div>

          <OTPInput value={code} onChange={setCode} length={6} />

          <button
            className="btn btn-primary w-full"
            onClick={verify}
            disabled={code.replace(/\D/g, "").length !== 6}
            style={{ backgroundColor: "#E43636", borderColor: "#E43636" }}
          >
            Verify
          </button>

          <button
            className="btn btn-outline w-full"
            onClick={async () => {
              setMsg(null);
              setErrMsg(null);
              try {
                await authApi.sendVerifyCode({ email });
                setMsg("New code sent ✅");
              } catch (e) {
                setErrMsg(getHttpErrorMessage(e));
              }
            }}
          >
            Resend code
          </button>

          {msg ? <Alert type="success">{msg}</Alert> : null}
          {errMsg ? <Alert type="error">{errMsg}</Alert> : null}
        </div>
      )}
    </AuthCard>
  );
}
