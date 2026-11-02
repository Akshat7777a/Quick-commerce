import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { useId } from "react";
import { cn } from "../../lib/format";

type Shared = {
  label: string;
  hint?: string;
  error?: string;
};

export function Field({
  label,
  hint,
  error,
  id,
  className,
  ...rest
}: Shared & InputHTMLAttributes<HTMLInputElement>) {
  const generated = useId();
  const inputId = id ?? `${generated}-input`;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  return (
    <div>
      <label htmlFor={inputId} className="label">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn("input", error && "input--error", className)}
        {...rest}
      />
      {hint && !error && (
        <p id={`${inputId}-hint`} className="mt-1.5 text-[12px] leading-4 text-ink-soft">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} role="alert" className="mt-1.5 text-[12px] leading-4 text-clay">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextAreaField({
  label,
  hint,
  error,
  id,
  className,
  ...rest
}: Shared & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const generated = useId();
  const inputId = id ?? `${generated}-textarea`;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  return (
    <div>
      <label htmlFor={inputId} className="label">
        {label}
      </label>
      <textarea
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn("input py-2.5", error && "input--error", className)}
        {...rest}
      />
      {hint && !error && (
        <p id={`${inputId}-hint`} className="mt-1.5 text-[12px] leading-4 text-ink-soft">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} role="alert" className="mt-1.5 text-[12px] leading-4 text-clay">
          {error}
        </p>
      )}
    </div>
  );
}
