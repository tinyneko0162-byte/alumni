"use client";

import { useId, useState } from "react";
import { Icon } from "@/components/ui/Icon";

/** Labelled input with a leading icon; password fields get a show/hide toggle. */
export function FormField({
  label,
  icon,
  name,
  type = "text",
  placeholder,
  hint,
  required = true,
  autoComplete,
  value,
  onChange,
  error,
}: {
  label: string;
  icon: string;
  name: string;
  type?: "text" | "email" | "tel" | "password";
  placeholder?: string;
  hint?: string;
  required?: boolean;
  autoComplete?: string;
  value?: string;
  onChange?: (v: string) => void;
  error?: string;
}) {
  const id = useId();
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="flex w-full flex-col gap-1.5">
      <div className="flex w-full flex-col gap-[7px]">
        <label htmlFor={id} className="text-[13px] font-medium text-ink">
          {label}
          {required && " *"}
        </label>
        <div
          className={`flex h-[52px] w-full items-center gap-2.5 rounded-xl border bg-white px-3.5 focus-within:border-brand-soft focus-within:ring-2 focus-within:ring-brand/15 ${
            error ? "border-danger" : "border-line"
          }`}
        >
          <Icon name={icon} size={18} />
          <input
            id={id}
            name={name}
            type={isPassword && show ? "text" : type}
            placeholder={placeholder}
            required={required}
            autoComplete={autoComplete}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[14px] text-black outline-none placeholder:text-black/80"
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              className="rounded p-0.5 hover:bg-surface-muted"
            >
              <Icon name="eye-off" size={18} />
            </button>
          )}
        </div>
      </div>
      {error ? (
        <p className="text-[11px] text-danger">{error}</p>
      ) : (
        hint && <p className="text-[11px] text-black">{hint}</p>
      )}
    </div>
  );
}
