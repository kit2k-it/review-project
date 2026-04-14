"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";

interface SubmitButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
  children?: React.ReactNode;
  pendingText?: string;
}

export function SubmitButton({ children, pendingText, className, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className={className}
      {...props}
    >
      {pending ? (
        <>
          <span className="animate-spin mr-2">⟳</span>
          {pendingText || "Đang xử lý..."}
        </>
      ) : children}
    </Button>
  );
}