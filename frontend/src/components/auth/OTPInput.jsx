import React, { useMemo } from "react";

export default function OTPInput({ value, onChange, length = 6 }) {
  const chars = useMemo(() => {
    const v = (value || "").replace(/\D/g, "").slice(0, length);
    return Array.from({ length }, (_, i) => v[i] || "");
  }, [value, length]);

  const handle = (index, digit) => {
    const clean = String(digit || "").replace(/\D/g, "").slice(-1);
    const next = chars.map((c, i) => (i === index ? clean : c)).join("");
    onChange(next);

    // فوکوس بعدی
    const el = document.getElementById(`otp-${index + 1}`);
    if (clean && el) el.focus();
  };

  const onKeyDown = (index, e) => {
    if (e.key === "Backspace" && !chars[index]) {
      const prev = document.getElementById(`otp-${index - 1}`);
      if (prev) prev.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-between">
      {chars.map((c, i) => (
        <input
          key={i}
          id={`otp-${i}`}
          value={c}
          onChange={(e) => handle(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          inputMode="numeric"
          maxLength={1}
          className="input input-bordered w-12 text-center text-lg font-semibold"
        />
      ))}
    </div>
  );
}
