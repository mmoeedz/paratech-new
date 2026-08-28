"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { SERVICE_CATEGORIES } from "@/data/services";
import { BUDGETS, NOT_SURE_SERVICE } from "@/data/contact";
import { ArrowRight } from "./ui/Icons";
import { submitContactForm, type ContactState } from "@/app/contact/actions";

const fieldClass =
  "w-full rounded-lg border border-line-light bg-white px-4 py-3 text-base text-ink placeholder:text-ink-faint transition-colors focus:border-copper-ink focus:outline-none sm:text-sm";

const labelClass =
  "block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint";

const errorClass = "mt-1.5 text-xs text-red-600";

const initialState: ContactState = { status: "idle" };

const VALID_SERVICES = [
  ...SERVICE_CATEGORIES.map((category) => category.title),
  NOT_SURE_SERVICE,
];

export function ContactForm({
  defaultService,
}: {
  /** Pre-selects the service dropdown, e.g. from a page-specific CTA link. */
  defaultService?: string;
}) {
  const preselectedService =
    defaultService && VALID_SERVICES.includes(defaultService)
      ? defaultService
      : SERVICE_CATEGORIES[0].title;

  const [state, setState] = useState<ContactState>(initialState);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const sourceUrlRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (sourceUrlRef.current) {
      sourceUrlRef.current.value = window.location.href;
    }
  }, []);

  const errors = state.fieldErrors ?? {};

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await submitContactForm(state, formData);
      setState(result);
      // Only clear the visitor's input once we know the enquiry went
      // through — an error must never make them retype everything.
      if (result.status === "success") {
        formRef.current?.reset();
      }
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Honeypot — hidden from real visitors, catnip for bots that fill
          every field. Never display:none, so naive scrapers still find it. */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
      >
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <input type="hidden" name="sourceUrl" ref={sourceUrlRef} />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClass}>
            Name <span className="text-copper-ink">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            minLength={2}
            autoComplete="name"
            placeholder="Your name"
            className={`mt-2.5 ${fieldClass}`}
          />
          {errors.name && <p className={errorClass}>{errors.name}</p>}
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
            Email <span className="text-copper-ink">*</span>
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
          {errors.email && <p className={errorClass}>{errors.email}</p>}
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
            defaultValue={preselectedService}
            className={`mt-2.5 ${fieldClass}`}
          >
            {SERVICE_CATEGORIES.map((category) => (
              <option key={category.slug} value={category.title}>
                {category.title}
              </option>
            ))}
            <option value={NOT_SURE_SERVICE}>{NOT_SURE_SERVICE}</option>
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
          <span className="text-copper-ink">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          minLength={20}
          rows={5}
          placeholder="The workflow, page, or process that's costing you the most right now."
          className={`mt-2.5 resize-y ${fieldClass}`}
        />
        {errors.message && <p className={errorClass}>{errors.message}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="group inline-flex items-center gap-2 rounded-full bg-copper px-6 py-3 text-sm font-medium text-obsidian transition-colors hover:bg-copper-light disabled:opacity-70"
        >
          {isPending ? "Sending…" : "Send enquiry"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
        <p
          aria-live="polite"
          className={`text-xs ${
            state.status === "error" ? "text-red-600" : "text-ink-faint"
          }`}
        >
          {state.status === "success"
            ? state.message
            : state.status === "error"
              ? state.message
              : "We reply within one business day."}
        </p>
      </div>
    </form>
  );
}
