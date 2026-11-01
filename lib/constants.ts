import type {
  ApplicationMethod,
  ApplicationStatus,
  EmailDirection,
  EmailKind,
  TemplateKind,
} from "@/lib/db/schema";

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: "Applied",
  awaiting_response: "Awaiting response",
  replied: "Replied",
  follow_up_due: "Follow-up due",
  interview: "Interview",
  assessment: "Assessment",
  offer: "Offer",
  rejected: "Rejected",
  ghosted: "Ghosted",
  withdrawn: "Withdrawn",
};

export const STATUS_ORDER: ApplicationStatus[] = [
  "applied",
  "awaiting_response",
  "replied",
  "follow_up_due",
  "interview",
  "assessment",
  "offer",
  "rejected",
  "ghosted",
  "withdrawn",
];

export const ACTIVE_STATUSES: ApplicationStatus[] = [
  "applied",
  "awaiting_response",
  "replied",
  "follow_up_due",
  "interview",
  "assessment",
];

export const RESPONSE_STATUSES: ApplicationStatus[] = [
  "replied",
  "follow_up_due",
  "interview",
  "assessment",
  "offer",
  "rejected",
  "ghosted",
];

export const INTERVIEW_STATUSES: ApplicationStatus[] = ["interview", "assessment", "offer"];

export const STATUS_STYLES: Record<
  ApplicationStatus,
  { dot: string; className: string; soft: string; text: string }
> = {
  applied: {
    dot: "bg-[#6d8aa6]",
    className: "border-[#e4e8ee] bg-[#f5f7f9] text-[#5b6b7b]",
    soft: "bg-[#eef2f5]",
    text: "text-[#536879]",
  },
  awaiting_response: {
    dot: "bg-[#a19a68]",
    className: "border-[#eee8d5] bg-[#fbf8ef] text-[#8c7b3d]",
    soft: "bg-[#f7f2df]",
    text: "text-[#8c7b3d]",
  },
  replied: {
    dot: "bg-[#4d91c7]",
    className: "border-[#dcecf7] bg-[#f2f9fd] text-[#357ba9]",
    soft: "bg-[#e6f4fb]",
    text: "text-[#357ba9]",
  },
  follow_up_due: {
    dot: "bg-[#e8a240]",
    className: "border-[#f5ead5] bg-[#fffaf1] text-[#c1842c]",
    soft: "bg-[#fbf0da]",
    text: "text-[#c1842c]",
  },
  interview: {
    dot: "bg-[#8a6fd0]",
    className: "border-[#e9e3f8] bg-[#f8f5ff] text-[#7557b7]",
    soft: "bg-[#f0eafd]",
    text: "text-[#7557b7]",
  },
  assessment: {
    dot: "bg-[#6d7ed3]",
    className: "border-[#e2e5f7] bg-[#f5f7fe] text-[#5668b5]",
    soft: "bg-[#eaeefb]",
    text: "text-[#5668b5]",
  },
  offer: {
    dot: "bg-[#4aa47a]",
    className: "border-[#d9f0e5] bg-[#f1fbf6] text-[#2e8a61]",
    soft: "bg-[#e3f5ec]",
    text: "text-[#2e8a61]",
  },
  rejected: {
    dot: "bg-[#dc6478]",
    className: "border-[#f8e1e5] bg-[#fff6f7] text-[#c24e63]",
    soft: "bg-[#fbe9ed]",
    text: "text-[#c24e63]",
  },
  ghosted: {
    dot: "bg-[#8d8d94]",
    className: "border-[#ececee] bg-[#f8f8f9] text-[#6f6f77]",
    soft: "bg-[#efeff1]",
    text: "text-[#6f6f77]",
  },
  withdrawn: {
    dot: "bg-[#a3a3a8]",
    className: "border-[#ececee] bg-white text-[#8a8a90]",
    soft: "bg-[#f4f4f5]",
    text: "text-[#8a8a90]",
  },
};

export const METHOD_LABELS: Record<ApplicationMethod, string> = {
  cold_email: "Cold email",
  linkedin: "LinkedIn",
  referral: "Referral",
  job_portal: "Job portal",
  other: "Other",
};

export const METHOD_ORDER: ApplicationMethod[] = [
  "cold_email",
  "linkedin",
  "referral",
  "job_portal",
  "other",
];

export const EMAIL_DIRECTION_LABELS: Record<EmailDirection, string> = {
  outbound: "Sent",
  inbound: "Received",
};

export const EMAIL_KIND_LABELS: Record<EmailKind, string> = {
  initial: "Initial application",
  follow_up: "Follow-up",
  reply: "Reply",
  interview: "Interview",
  assessment: "Assessment",
  offer: "Offer",
  rejection: "Rejection",
  other: "Other",
};

export const TEMPLATE_KIND_LABELS: Record<TemplateKind, string> = {
  cold_email: "Cold email",
  follow_up: "Follow-up",
  reply: "Reply",
  other: "Other",
};

export const ACTIVITY_LABELS = {
  application_created: "Application created",
  email_sent: "Email sent",
  email_received: "Reply received",
  follow_up_sent: "Follow-up sent",
  reply_received: "Reply received",
  interview_scheduled: "Interview",
  assessment_received: "Assessment",
  status_changed: "Status updated",
  note_added: "Note",
  follow_up_scheduled: "Follow-up scheduled",
  offer_received: "Offer received",
  rejection_received: "Rejection received",
  withdrawn: "Withdrawn",
} as const;

export const TEMPLATE_VARIABLES = [
  "{{company}}",
  "{{position}}",
  "{{contactName}}",
  "{{myName}}",
  "{{email}}",
];

export const TERMINAL_STATUSES: ApplicationStatus[] = [
  "offer",
  "rejected",
  "ghosted",
  "withdrawn",
];
