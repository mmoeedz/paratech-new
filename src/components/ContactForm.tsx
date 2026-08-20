"use client";

import { useState } from "react";
import { SERVICE_CATEGORIES } from "@/data/services";
import { ArrowRight } from "./ui/Icons";

const BUDGETS = [
  "Not sure yet",
  "Under $5k",
  "$5k – $15k",
  "$15k – $50k",
  "$50k+",
];

const fieldClass =
  "w-full rounded-lg border border-line bg-obsidian/60 px-4 py-3 text-base text-cloud placeholder:text-cloud-faint transition-colors focus:border-copper focus:outline-none sm:text-sm";

const labelClass =
  "block font-mono text-[10px] uppercase tracking-[0.16em] text-cloud-faint";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  // No backend is wired up yet, so this composes a pre-filled email rather
  // than silently dropping the enquiry.
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");

    const data = new FormData(event.currentTarget);
    const lines = [
      `Name: ${data.get("name")}`,
      `Company: ${data.get("company") || "—"}`,
      `Email: ${data.get("email")}`,
      `Phone: ${data.get("phone") || "—"}`,
      `Interested in: ${data.get("service")}`,
      `Budget: ${data.get("budget")}`,
      "",
      "What they want to improve:",
      String(data.get("message") ?? ""),
    ];

    const subject = encodeURIComponent(
      `New enquiry — ${data.get("service")} — ${data.get("name")}`
    );
    const body = encodeURIComponent(lines.join("\n"));

    window.location.href = `mailto:hello@paratech.agency?subject=${subject}&body=${body}`;
    setStatus("sent");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClass}>
            Name <span className="text-copper">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Your name"
            className={`mt-2.5 ${fieldClass}`}
          />
        </div>
        <div>
          <label htmlFor="company" className={labelClass}>
            Company
          </label>
          <input
            id="company"
            name="company"
            type="text"
            autoComplete="organization"
            placeholder="Company name"
            className={`mt-2.5 ${fieldClass}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className={labelClass}>
            Email <span className="text-copper">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            className={`mt-2.5 ${fieldClass}`}
          />
        </div>
        <div>
          <label htmlFor="phone" className={labelClass}>
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="Optional"
            className={`mt-2.5 ${fieldClass}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="service" className={labelClass}>
            What do you need?
          </label>
          <select
            id="service"
            name="service"
            defaultValue={SERVICE_CATEGORIES[0].title}
            className={`mt-2.5 ${fieldClass}`}
          >
            {SERVICE_CATEGORIES.map((category) => (
              <option key={category.slug} value={category.title}>
                {category.title}
              </option>
            ))}
            <option value="Not sure / a mix">Not sure / a mix</option>
          </select>
        </div>
        <div>
          <label htmlFor="budget" className={labelClass}>
            Budget range
          </label>
          <select
            id="budget"
            name="budget"
            defaultValue={BUDGETS[0]}
            className={`mt-2.5 ${fieldClass}`}
          >
            {BUDGETS.map((budget) => (
              <option key={budget} value={budget}>
                {budget}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="message" className={labelClass}>
          What are you trying to improve?{" "}
          <span className="text-copper">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="The workflow, page, or process that's costing you the most right now."
          className={`mt-2.5 resize-y ${fieldClass}`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-1">
        <button
          type="submit"
          disabled={status === "sending"}
          className="group inline-flex items-center gap-2 rounded-full bg-copper px-6 py-3 text-sm font-medium text-obsidian transition-colors hover:bg-copper-light disabled:opacity-70"
        >
          Send enquiry
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
        <p aria-live="polite" className="text-xs text-cloud-faint">
          {status === "sent"
            ? "Your email client should have opened — hit send and we'll reply within one business day."
            : "We reply within one business day."}
        </p>
      </div>
    </form>
  );
}
