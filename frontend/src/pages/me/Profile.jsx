import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import useAuth from "../../hooks/useAuth";
import { meApi } from "../../api/me.api";
import { getHttpErrorMessage } from "../../utils/httpError";

import Alert from "../../components/common/Alert";

export default function Profile() {
  const { user, updateUser } = useAuth();

  const [tab, setTab] = useState("profile");

  // profile form
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [profileMsg, setProfileMsg] = useState(null);
  const [profileErr, setProfileErr] = useState(null);

  const profileForm = useForm({
    defaultValues: { name: user?.name || "" },
  });

  // password form
  const [passMsg, setPassMsg] = useState(null);
  const [passErr, setPassErr] = useState(null);

  const passForm = useForm();

  const avatarUrl = useMemo(() => user?.avatar?.url || "", [user]);

  const onPickAvatar = (file) => {
    setAvatarFile(file || null);
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const submitProfile = async (values) => {
    setProfileMsg(null);
    setProfileErr(null);

    try {
      const fd = new FormData();

      // name optional
      if (values.name && values.name.trim()) fd.append("name", values.name.trim());
      // avatar optional (field name MUST be "avatar")
      if (avatarFile) fd.append("avatar", avatarFile);

      const res = await meApi.updateProfile(fd);

      const updatedUser = res?.data?.user;
      if (updatedUser) updateUser(updatedUser);

      setProfileMsg(res?.data?.message || "Profile updated ✅");
    } catch (e) {
      setProfileErr(getHttpErrorMessage(e));
    }
  };

  const submitPassword = async (values) => {
    setPassMsg(null);
    setPassErr(null);

    try {
      const res = await meApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      setPassMsg(res?.data?.message || "Password changed successfully ✅");
      passForm.reset();
    } catch (e) {
      setPassErr(getHttpErrorMessage(e));
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="card bg-base-100 shadow border border-black/10">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="avatar">
                <div className="w-16 rounded-2xl border border-black/10 overflow-hidden bg-base-200">
                  {preview ? (
                    <img src={preview} alt="preview" />
                  ) : avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-xl font-bold opacity-60">
                      {user?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Profile</h1>
                <p className="opacity-70 text-sm">{user?.email}</p>
                <div className="mt-2 flex gap-2 flex-wrap">
                  {user?.roles?.map((r) => (
                    <span key={r} className="badge badge-outline border-black/20">
                      {r}
                    </span>
                  ))}
                  {user?.isEmailVerified ? (
                    <span className="badge badge-success">Email Verified</span>
                  ) : (
                    <span className="badge badge-warning">Not Verified</span>
                  )}
                </div>
              </div>
            </div>

            <div className="join">
              <button
                className={`btn join-item ${tab === "profile" ? "btn-active" : ""}`}
                onClick={() => setTab("profile")}
              >
                Profile Settings
              </button>
              <button
                className={`btn join-item ${tab === "security" ? "btn-active" : ""}`}
                onClick={() => setTab("security")}
              >
                Security
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {/* Left: Profile update */}
        <div className="card bg-base-100 shadow border border-black/10">
          <div className="card-body">
            <h2 className="text-lg font-bold">Update Profile</h2>
            <p className="text-sm opacity-70">
              Change your name and avatar. (avatar: jpg/png/webp, max 2MB)
            </p>

            {tab !== "profile" ? (
              <div className="mt-4 opacity-70">
                Switch to <b>Profile Settings</b> tab to edit profile.
              </div>
            ) : (
              <form
                onSubmit={profileForm.handleSubmit(submitProfile)}
                className="mt-4 space-y-3"
              >
                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text font-medium">Full name</span>
                  </div>
                  <input
                    className={`input input-bordered w-full ${
                      profileForm.formState.errors?.name ? "input-error" : ""
                    }`}
                    placeholder="Your name"
                    {...profileForm.register("name", {
                      minLength: { value: 2, message: "Min 2 characters" },
                      maxLength: { value: 60, message: "Max 60 characters" },
                    })}
                  />
                  {profileForm.formState.errors?.name ? (
                    <div className="label">
                      <span className="label-text-alt text-error">
                        {profileForm.formState.errors?.name?.message}
                      </span>
                    </div>
                  ) : null}
                </label>

                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text font-medium">Avatar</span>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="file-input file-input-bordered w-full"
                    onChange={(e) => onPickAvatar(e.target.files?.[0])}
                  />
                  <div className="label">
                    <span className="label-text-alt opacity-70">
                      Field name is <b>avatar</b> (matches backend)
                    </span>
                  </div>
                </label>

                <button
                  className="btn btn-primary w-full"
                  disabled={profileForm.formState.isSubmitting}
                  style={{ backgroundColor: "#E43636", borderColor: "#E43636" }}
                >
                  {profileForm.formState.isSubmitting ? "Updating..." : "Update profile"}
                </button>

                {profileMsg ? <Alert type="success">{profileMsg}</Alert> : null}
                {profileErr ? <Alert type="error">{profileErr}</Alert> : null}
              </form>
            )}
          </div>
        </div>

        {/* Right: Change password */}
        <div className="card bg-base-100 shadow border border-black/10">
          <div className="card-body">
            <h2 className="text-lg font-bold">Change Password</h2>
            <p className="text-sm opacity-70">
              currentPassword (min 6) • newPassword (min 8)
            </p>

            {tab !== "security" ? (
              <div className="mt-4 opacity-70">
                Switch to <b>Security</b> tab to change password.
              </div>
            ) : (
              <form onSubmit={passForm.handleSubmit(submitPassword)} className="mt-4 space-y-3">
                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text font-medium">Current password</span>
                  </div>
                  <input
                    type="password"
                    className={`input input-bordered w-full ${
                      passForm.formState.errors?.currentPassword ? "input-error" : ""
                    }`}
                    placeholder="Enter current password"
                    {...passForm.register("currentPassword", {
                      required: "Current password is required",
                      minLength: { value: 6, message: "Min 6 characters" },
                      maxLength: { value: 72, message: "Max 72 characters" },
                    })}
                  />
                  {passForm.formState.errors?.currentPassword ? (
                    <div className="label">
                      <span className="label-text-alt text-error">
                        {passForm.formState.errors?.currentPassword?.message}
                      </span>
                    </div>
                  ) : null}
                </label>

                <label className="form-control w-full">
                  <div className="label">
                    <span className="label-text font-medium">New password</span>
                  </div>
                  <input
                    type="password"
                    className={`input input-bordered w-full ${
                      passForm.formState.errors?.newPassword ? "input-error" : ""
                    }`}
                    placeholder="Enter new password"
                    {...passForm.register("newPassword", {
                      required: "New password is required",
                      minLength: { value: 8, message: "Min 8 characters" },
                      maxLength: { value: 72, message: "Max 72 characters" },
                    })}
                  />
                  {passForm.formState.errors?.newPassword ? (
                    <div className="label">
                      <span className="label-text-alt text-error">
                        {passForm.formState.errors?.newPassword?.message}
                      </span>
                    </div>
                  ) : null}
                </label>

                <button
                  className="btn btn-primary w-full"
                  disabled={passForm.formState.isSubmitting}
                  style={{ backgroundColor: "#E43636", borderColor: "#E43636" }}
                >
                  {passForm.formState.isSubmitting ? "Changing..." : "Change password"}
                </button>

                {passMsg ? <Alert type="success">{passMsg}</Alert> : null}
                {passErr ? <Alert type="error">{passErr}</Alert> : null}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
