// Textarea Field Component
// Custom textarea with character count and auto-resize

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaFieldProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  showCount?: boolean;
  autoResize?: boolean;
}

export const TextareaField = React.forwardRef<
  HTMLTextAreaElement,
  TextareaFieldProps
>(
  (
    { className, error, showCount, maxLength, autoResize, onChange, ...props },
    ref,
  ) => {
    const [charCount, setCharCount] = React.useState(
      props.value?.toString().length || 0,
    );
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

    // Combine refs
    React.useImperativeHandle(ref, () => textareaRef.current!);

    // Auto-resize handler
    const handleResize = React.useCallback(() => {
      if (autoResize && textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, [autoResize]);

    // Handle change
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      handleResize();
      onChange?.(e);
    };

    // Initial resize
    React.useEffect(() => {
      handleResize();
    }, [handleResize]);

    return (
      <div className="relative">
        <textarea
          ref={textareaRef}
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            "ring-offset-background placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            autoResize && "resize-none overflow-hidden",
            error && "border-destructive focus-visible:ring-destructive",
            className,
          )}
          maxLength={maxLength}
          onChange={handleChange}
          {...props}
        />
        {showCount && maxLength && (
          <div
            className={cn(
              "absolute bottom-2 right-2 text-xs text-muted-foreground",
              charCount > maxLength * 0.9 && "text-warning",
              charCount >= maxLength && "text-destructive",
            )}
          >
            {charCount}/{maxLength}
          </div>
        )}
      </div>
    );
  },
);

TextareaField.displayName = "TextareaField";

export default TextareaField;
