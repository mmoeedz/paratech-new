import type { ComponentType } from "react";
import {
  ClipboardIcon,
  GearIcon,
  FlowIcon,
  BellIcon,
  ChartUpIcon,
  CheckCircleIcon,
} from "@/components/ui/Icons";

export type AutomationStep = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  hasDot?: boolean;
};

export const AUTOMATION_STEPS: AutomationStep[] = [
  {
    icon: ClipboardIcon,
    title: "Capture",
    description:
      "We collect the right information through smart forms and integrations.",
  },
  {
    icon: GearIcon,
    title: "Process",
    description:
      "Our system organizes and processes the data accurately and instantly.",
  },
  {
    icon: FlowIcon,
    title: "Automate",
    description:
      "Workflows are automated to handle tasks, approvals, and updates.",
  },
  {
    icon: BellIcon,
    title: "Notify",
    description: "The right people get real-time alerts and notifications.",
    hasDot: true,
  },
  {
    icon: ChartUpIcon,
    title: "Analyze",
    description:
      "We turn data into insights so you can make better decisions.",
  },
  {
    icon: CheckCircleIcon,
    title: "Deliver",
    description:
      "Automated outputs and reports are delivered where you need them.",
  },
];

export type Workflow = {
  title: string;
  flow: string;
};

export const WORKFLOWS: Workflow[] = [
  {
    title: "Lead generation",
    flow: "Website form → AI qualification → CRM → notification → automated follow-up",
  },
  {
    title: "Customer support",
    flow: "Customer message → AI agent → knowledge base → response → escalation when needed",
  },
  {
    title: "Content operations",
    flow: "Topic → research → draft generation → human approval → publishing",
  },
  {
    title: "Reporting",
    flow: "Business data → analysis → dashboard → scheduled report → recommendations",
  },
  {
    title: "Appointments",
    flow: "Lead → qualification → calendar → booking → reminders → CRM update",
  },
  {
    title: "Internal operations",
    flow: "Form or input → processing → database → task creation → notification",
  },
];
