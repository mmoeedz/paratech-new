"use client";

import { useEffect } from "react";
import { SITE } from "@/lib/site";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  // The root layout itself failed, so this can't rely on its fonts, nav, or
  // footer — it renders a full, standalone html/body as its own fallback.
  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
          padding: "1.5rem",
          textAlign: "center",
          background: "#0b0a09",
          color: "#f4f1ea",
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 600, margin: 0 }}>
            Something went wrong.
          </h1>
          <p style={{ marginTop: "0.75rem", color: "#b5afa6" }}>
            Please try again, or email {SITE.email} if it keeps happening.
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          style={{
            borderRadius: "9999px",
            background: "#c08040",
            color: "#0b0a09",
            padding: "0.75rem 1.5rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            border: "none",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
