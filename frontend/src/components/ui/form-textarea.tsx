import * as React from "react";
import { Textarea } from "./textarea";
import { cn } from "./utils";

interface FormTextareaProps extends React.ComponentProps<"textarea"> {
  errorMessage?: string;
  customValidationMessage?: string;
}

const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ className, errorMessage, customValidationMessage, required, onInvalid, onInput, ...props }, ref) => {
    const [validationMessage, setValidationMessage] = React.useState<string>("");

    const handleInvalid = (e: React.InvalidEvent<HTMLTextAreaElement>) => {
      e.preventDefault();
      const message = customValidationMessage || errorMessage || "Vui lòng điền trường này";
      setValidationMessage(message);
      
      // Don't show toast here - let parent form handle it
      // Toast will be shown by form's handleSubmit if needed
      
      // Also call custom onInvalid if provided
      if (onInvalid) {
        onInvalid(e);
      }
    };

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
      setValidationMessage("");
      if (onInput) {
        onInput(e);
      }
    };

    return (
      <div className="w-full">
        <Textarea
          ref={ref}
          className={cn(
            validationMessage && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/50",
            className
          )}
          required={required}
          onInvalid={handleInvalid}
          onInput={handleInput}
          {...props}
        />
        {validationMessage && (
          <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
            <span className="text-red-500">•</span>
            {validationMessage}
          </p>
        )}
      </div>
    );
  }
);

FormTextarea.displayName = "FormTextarea";

export { FormTextarea };

