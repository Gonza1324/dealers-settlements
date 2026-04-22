"use client";

import { useFormStatus } from "react-dom";

export function ConfirmSubmitButton({
  children,
  className,
  confirmMessage,
  pendingLabel,
}: {
  children: string;
  className?: string;
  confirmMessage: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className={className}
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
      type="submit"
    >
      {pending ? (pendingLabel ?? "Working...") : children}
    </button>
  );
}
