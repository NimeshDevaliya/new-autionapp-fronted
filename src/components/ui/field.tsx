"use client";

import { forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const CONTROL_BASE =
  "w-full rounded-md bg-ink border border-line-strong px-3 text-text placeholder:text-faint " +
  "transition-colors focus:border-amber focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed";

interface FieldWrapperProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

export function Field({
  label,
  hint,
  error,
  required,
  htmlFor,
  children,
  className,
}: FieldWrapperProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium text-muted">
          {label}
          {required && (
            <span className="text-ball ml-0.5" aria-hidden>
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-sm text-ball">{error}</p>
      ) : hint ? (
        <p className="text-sm text-faint">{hint}</p>
      ) : null}
    </div>
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, id, required, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <Field
        label={label}
        hint={hint}
        error={error}
        required={required}
        htmlFor={inputId}
      >
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={error ? true : undefined}
          className={cn(CONTROL_BASE, "h-11", error && "border-ball", className)}
          {...props}
        />
      </Field>
    );
  }
);
Input.displayName = "Input";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
}

/**
 * Native select with the browser's arrow replaced by our own, positioned on the
 * control itself so it stays centred whatever label or hint sits around it.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, hint, error, id, required, children, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;

    return (
      <Field
        label={label}
        hint={hint}
        error={error}
        required={required}
        htmlFor={selectId}
      >
        <span className="relative block">
          <select
            ref={ref}
            id={selectId}
            required={required}
            aria-invalid={error ? true : undefined}
            className={cn(
              CONTROL_BASE,
              "h-11 appearance-none pr-10 cursor-pointer",
              error && "border-ball",
              className
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
        </span>
      </Field>
    );
  }
);
Select.displayName = "Select";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, hint, error, id, required, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;

    return (
      <Field
        label={label}
        hint={hint}
        error={error}
        required={required}
        htmlFor={textareaId}
      >
        <textarea
          ref={ref}
          id={textareaId}
          required={required}
          aria-invalid={error ? true : undefined}
          rows={props.rows ?? 3}
          className={cn(CONTROL_BASE, "py-2.5 resize-y", error && "border-ball", className)}
          {...props}
        />
      </Field>
    );
  }
);
Textarea.displayName = "Textarea";
