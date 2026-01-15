import React from "react";
import { useForm } from "react-hook-form";
import { api } from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";
import { getHttpErrorMessage } from "../utils/httpError";
import useAuth from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const res = await api.post(ENDPOINTS.auth.login, data);

      // فرض: بک‌اند user را برمی‌گرداند
      setUser(res?.data?.user || res?.data);

      navigate("/", { replace: true });
    } catch (err) {
      alert(getHttpErrorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card bg-base-100 shadow p-6">
      <h2 className="text-lg font-semibold">Login</h2>

      <label className="form-control mt-4">
        <span className="label-text">Email</span>
        <input className="input input-bordered" {...register("email", { required: true })} />
      </label>

      <label className="form-control mt-3">
        <span className="label-text">Password</span>
        <input type="password" className="input input-bordered" {...register("password", { required: true })} />
      </label>

      <button className="btn btn-primary mt-5" disabled={isSubmitting}>
        {isSubmitting ? "Loading..." : "Login"}
      </button>
    </form>
  );
}
