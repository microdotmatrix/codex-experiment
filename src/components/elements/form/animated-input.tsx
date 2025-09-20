"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface AnimatedInputProps {
  name: string;
  label: string;
  controlled?: boolean;
  // Controlled mode props
  value?: string;
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  // Uncontrolled mode props
  defaultValue?: string;
  type?: "text" | "textarea" | "url" | "email" | "number";
  required?: boolean;
  placeholder?: string;
  className?: string;
  minLength?: number;
}

export function AnimatedInput({
  name,
  label,
  controlled = false,
  value,
  onChange,
  defaultValue = "",
  placeholder,
  type = "text",
  required = false,
  className = "",
  minLength = 0,
}: AnimatedInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(
    controlled ? value !== "" && value !== undefined : defaultValue !== ""
  );
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const labelVariants = {
    default: {
      y: 0,
      scale: 1,
      color: "var(--color-muted-foreground)",
      opacity: 1,
      originX: 0,
    },
    focused: {
      y: -29,
      x: -10,
      scale: 0.85,
      color: "var(--color-foreground)",
      opacity: 0.5,
      originX: 0,
    },
  };

  const isActive = isFocused || hasValue;

  const handleFocus = () => setIsFocused(true);

  const handleBlur = () => {
    setIsFocused(false);
    if (controlled) {
      setHasValue(value !== "" && value !== undefined);
    } else if (inputRef.current) {
      setHasValue(inputRef.current.value !== "");
    }
  };

  const handleInput = () => {
    if (!controlled && inputRef.current) {
      setHasValue(inputRef.current.value !== "");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (controlled && onChange) {
      onChange(e);
      setHasValue(e.target.value !== "");
    }
  };

  useEffect(() => {
    if (controlled) {
      setHasValue(value !== "" && value !== undefined);
    } else {
      setHasValue(defaultValue !== "");
    }
  }, [controlled, value, defaultValue]);

  const inputClasses =
    "h-10  shadow-inner outline-none transition border-input/50 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/20 placeholder:opacity-0 focus:placeholder:opacity-100 placeholder:transition-all placeholder:duration-200 placeholder:delay-100 placeholder:ease-in-out placeholder:translate-x-3 focus:placeholder:translate-x-0 placeholder:blur-sm focus:placeholder:blur-none";

  return (
    <div className="relative">
      <motion.label
        htmlFor={name}
        className={cn("absolute left-3 top-3 pointer-events-none text-sm uppercase tracking-[0.2em] transition-all duration-200", isActive ? "tracking-[0.3em] text-xs font-medium" : "")}
        initial="default"
        animate={isActive ? "focused" : "default"}
        variants={labelVariants}
        transition={{ duration: 0.2 }}
      >
        {label}
      </motion.label>

      {type === "textarea" ? (
        <Textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          id={name}
          name={name}
          {...(controlled
            ? { value: value || "", onChange: handleChange }
            : { defaultValue, onInput: handleInput })}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(inputClasses, className ? className : "h-32")}
          required={required}
          placeholder={placeholder}
        />
      ) : (
        <Input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={type}
          id={name}
          name={name}
          {...(controlled
            ? { value: value || "", onChange: handleChange }
            : { defaultValue, onInput: handleInput })}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(inputClasses, className ? className : "h-10")}
          required={required}
          placeholder={placeholder}
          minLength={minLength}
        />
      )}
    </div>
  );
}