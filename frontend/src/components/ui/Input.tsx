"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helpText, id, ...props }, ref) => {
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
        <input
          ref={ref}
          id={id}
          className={cn(
            "rounded-xl border-none bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder:text-[#B0B8C1] transition-all duration-200 focus:bg-white focus:border focus:border-[#3182F6] focus:outline-none focus:ring-2 focus:ring-[#3182F6]/10 disabled:cursor-not-allowed disabled:bg-[#F2F4F6] disabled:text-[#B0B8C1]",
            error && "bg-[#FFEAED]/30 focus:border-[#F04452] focus:ring-[#F04452]/10",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-[#F04452]">{error}</p>}
        {helpText && !error && (
          <p className="text-xs text-[#8B95A1]">{helpText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
