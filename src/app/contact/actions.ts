"use server";

import { Resend } from "resend";
import { z } from "zod";
import { SERVICE_CATEGORIES } from "@/data/services";
import { BUDGETS, NOT_SURE_SERVICE } from "@/data/contact";
import { SITE } from "@/lib/site";

const ALLOWED_SERVICES = [
  ...SERVICE_CATEGORIES.map((category) => category.title),
  NOT_SURE_SERVICE,
] as const;

const ContactSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(100),
  email: z.string().trim().email("Enter a valid email address."),
  company: z.string().trim().max(150).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  service: z
    .string()
    .refine((value) => (ALLOWED_SERVICES as readonly string[]).includes(value), {
      message: "Select what you need help with.",
    }),
  budget: z.enum(BUDGETS, { message: "Select a budget range." }),
  message: z
    .string()
    .trim()
    .min(20, "Tell us a little more — at least 20 characters.")
    .max(5000),
  sourceUrl: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type ContactFieldErrors = Partial<
  Record<keyof z.infer<typeof ContactSchema>, string>
>;

export type ContactState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: ContactFieldErrors;
};

const GENERIC_ERROR = `We could not send your enquiry. Please try again or email ${SITE.email} directly.`;

export async function submitContactForm(
  _prevState: ContactState,
  formData: FormData
): Promise<ContactState> {
  // Honeypot: real visitors never fill this hidden field. Bots that
  // autofill every field do — silently accept so they don't learn to retry.
  if (formData.get("website")) {
    return { status: "success" };
  }

  const parsed = ContactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    company: formData.get("company"),
    phone: formData.get("phone"),
    service: formData.get("service"),
    budget: formData.get("budget"),
    message: formData.get("message"),
    sourceUrl: formData.get("sourceUrl"),
  });

  if (!parsed.success) {
    const fieldErrors: ContactFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof ContactFieldErrors | undefined;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      status: "error",
      message: "Please fix the highlighted fields and try again.",
      fieldErrors,
    };
  }

  const { name, email, company, phone, service, budget, message, sourceUrl } =
    parsed.data;

  // Playwright drives the real form and needs to hit both branches
  // deterministically, without a live Resend key. Only active when the
  // e2e suite's own webServer sets this env var — never in production.
  if (process.env.PLAYWRIGHT_TEST_MODE === "true") {
    if (email.endsWith("+fail@playwright.test")) {
      return { status: "error", message: GENERIC_ERROR };
    }
    return {
      status: "success",
      message:
        "Thanks — your enquiry has been received. We will reply within one business day.",
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error(
      "RESEND_API_KEY is not set — contact form cannot deliver enquiries."
    );
    return { status: "error", message: GENERIC_ERROR };
  }

  const resend = new Resend(apiKey);
  const fromAddress =
    process.env.CONTACT_FROM_EMAIL ?? "Paratech <onboarding@resend.dev>";
  const toAddress = process.env.CONTACT_TO_EMAIL ?? SITE.email;

  const summaryLines = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Company: ${company || "—"}`,
    `Phone: ${phone || "—"}`,
    `Interested in: ${service}`,
    `Budget: ${budget}`,
    `Source: ${sourceUrl || "—"}`,
    "",
    "What they want to improve:",
    message,
  ].join("\n");

  try {
    await resend.emails.send({
      from: fromAddress,
      to: toAddress,
      replyTo: email,
      subject: `New enquiry — ${service} — ${name}`,
      text: summaryLines,
    });

    await resend.emails.send({
      from: fromAddress,
      to: email,
      subject: `We've received your enquiry — ${SITE.name}`,
      text: "Thanks — your enquiry has been received. We will reply within one business day.",
    });
  } catch (error) {
    console.error("Failed to send contact form email", error);
    return { status: "error", message: GENERIC_ERROR };
  }

  return {
    status: "success",
    message:
      "Thanks — your enquiry has been received. We will reply within one business day.",
  };
}
