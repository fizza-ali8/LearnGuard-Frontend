"use client";

import { fieldClass, Field } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Minus, Plus } from "lucide-react";
import { forwardRef, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function Input({ className, invalid, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(fieldClass, invalid && "border-risk-high focus:border-risk-high focus:ring-risk-high/10", className)}
        {...props}
      />
    );
  },
);

export function PasswordInput({
  invalid,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input {...props} invalid={invalid} type={visible ? "text" : "password"} className={cn("pr-11", className)} />
      <button
        type="button"
        className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-soft hover:text-heading"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function Textarea({ className, invalid, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        fieldClass,
        "h-auto min-h-28 resize-y py-3 leading-6",
        invalid && "border-risk-high focus:border-risk-high focus:ring-risk-high/10",
        className,
      )}
      {...props}
    />
  );
});

export function Select({
  className,
  invalid,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      className={cn(fieldClass, "appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10", invalid && "border-risk-high", className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%236B7280' stroke-width='1.8' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      }}
      {...props}
    >
      {children}
    </select>
  );
}

export function Checkbox({
  label,
  checked,
  onChange,
  name,
  id,
}: {
  label: ReactNode;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  name?: string;
  id?: string;
}) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 text-sm leading-5 text-body">
      <input
        id={id}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange?.(event.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-line accent-primary"
      />
      <span>{label}</span>
    </label>
  );
}

export function RadioGroup<T extends string>({
  label,
  value,
  onChange,
  options,
  name,
}: {
  label?: string;
  value?: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; description?: string }[];
  name: string;
}) {
  return (
    <fieldset>
      {label ? <legend className="mb-2 text-[13px] font-medium text-heading">{label}</legend> : null}
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-2 rounded-[10px] border px-3 text-sm",
                selected ? "border-primary bg-primary-soft text-primary-dark" : "border-line bg-surface text-body hover:bg-primary-softer",
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="accent-primary"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-heading">{label}</p>
        {description ? <p className="text-xs leading-5 text-muted">{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-[#E4E4EC]",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform",
            checked && "translate-x-5",
          )}
        />
      </button>
    </div>
  );
}

export function Slider({
  label,
  value,
  min = 0,
  max = 100,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          aria-label={label}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full"
        />
        <span className="w-10 text-right text-sm font-semibold text-heading">{value}</span>
      </div>
    </Field>
  );
}

export function CounterInput({
  label,
  value,
  min = 0,
  max = 40,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  suffix?: string;
}) {
  return (
    <Field label={label}>
      <div className="flex h-11 items-center justify-between rounded-[10px] border border-line bg-surface px-1.5">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-heading hover:bg-soft"
          onClick={() => onChange(Math.max(min, value - 1))}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-heading">
          {value}
          {suffix ? <span className="ml-1 font-medium text-muted">{suffix}</span> : null}
        </span>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-heading hover:bg-soft"
          onClick={() => onChange(Math.min(max, value + 1))}
          aria-label={`Increase ${label}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </Field>
  );
}
