"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Option[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-[#4E5968]"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            "rounded-xl border-none bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] transition-all duration-200 focus:bg-white focus:border focus:border-[#3182F6] focus:outline-none focus:ring-2 focus:ring-[#3182F6]/10 disabled:cursor-not-allowed disabled:bg-[#F2F4F6] disabled:text-[#B0B8C1]",
            error && "bg-[#FFEAED]/30 focus:border-[#F04452] focus:ring-[#F04452]/10",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-[#F04452]">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
export default Select;
