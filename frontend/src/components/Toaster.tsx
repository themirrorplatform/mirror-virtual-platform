/**
 * Toast Notifications Component
 * Using Sonner for beautiful, accessible toast notifications
 */
"use client";

import { Toaster } from "sonner";

export function MirrorToaster() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      theme="dark"
      toastOptions={{
        className: "font-sans",
        style: {
          background: "#18181b",
          border: "1px solid #27272a",
          color: "#fafafa",
        },
      }}
    />
  );
}

/**
 * Usage example:
 * 
 * import { toast } from "sonner";
 * 
 * // Success
 * toast.success("Reflection saved");
 * 
 * // Error
 * toast.error("Failed to save reflection");
 * 
 * // Info
 * toast.info("MirrorX is thinking...");
 * 
 * // Custom
 * toast("Custom message", {
 *   description: "Additional context",
 *   action: {
 *     label: "Undo",
 *     onClick: () => console.log("Undo"),
 *   },
 * });
 */
