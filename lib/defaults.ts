import type { TemplateKind } from "@/lib/db/schema";

export const DEFAULT_TEMPLATES: Array<{
  name: string;
  kind: TemplateKind;
  subject: string;
  body: string;
}> = [
  {
    name: "Cold outreach: short & specific",
    kind: "cold_email",
    subject: "Quick question about the {{position}} role at {{company}}",
    body: `Hi {{contactName}},

I'm {{myName}}, and I've been following {{company}}'s work with genuine interest. I'm reaching out about the {{position}} opening. My background in building thoughtful, user-centered products feels closely aligned with the team's approach.

I'd love to share a short note on how I could contribute. Would you be open to a quick conversation this week?

Best,
{{myName}}
{{email}}`,
  },
  {
    name: "Day 5 check-in",
    kind: "follow_up",
    subject: "Re: {{position}} at {{company}}",
    body: `Hi {{contactName}},

Just floating my note back to the top of your inbox. I understand this is a busy time, but I remain very interested in the {{position}} role at {{company}}.

Happy to send over any additional context that would be useful.

Best,
{{myName}}`,
  },
  {
    name: "Thank you after interview",
    kind: "reply",
    subject: "Thank you for the {{position}} conversation",
    body: `Hi {{contactName}},

Thank you for taking the time to speak with me today. I really enjoyed learning more about the team and the problems you're solving at {{company}}.

Our conversation made me even more excited about the {{position}} opportunity. Please don't hesitate to reach out if I can clarify anything.

Best,
{{myName}}`,
  },
];
