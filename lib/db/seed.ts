import { addDays, setHours, setMinutes, startOfDay, subDays } from "date-fns";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import {
  activities,
  applications,
  companies,
  emailInteractions,
  settings,
  templates,
  users,
  type ApplicationMethod,
  type ApplicationStatus,
  type EmailDirection,
  type EmailKind,
} from "./schema";
import type * as schema from "./schema";
import { DEFAULT_TEMPLATES } from "@/lib/defaults";
import { DEMO_AVATAR, DEMO_EMAIL, DEMO_NAME, DEMO_PASSWORD } from "@/lib/auth/demo";
import { hashPassword } from "@/lib/auth/password";

type Db = PgliteDatabase<typeof schema>;

function at(daysAgo: number, hour = 10, minute = 12) {
  return setMinutes(setHours(startOfDay(subDays(new Date(), daysAgo)), hour), minute);
}

function inDays(days: number) {
  return addDays(startOfDay(new Date()), days);
}

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

type EmailSeed = {
  direction: EmailDirection;
  kind: EmailKind;
  subject: string;
  body: string;
  daysAgo: number;
  hour?: number;
};

type ActivitySeed = {
  type:
    | "status_changed"
    | "note_added"
    | "interview_scheduled"
    | "assessment_received"
    | "offer_received"
    | "rejection_received"
    | "withdrawn"
    | "follow_up_scheduled";
  title: string;
  description?: string;
  daysAgo: number;
  hour?: number;
  metadata?: Record<string, unknown>;
};

type AppSeed = {
  company: string;
  website: string;
  position: string;
  location: string;
  contactName: string;
  contactEmail: string;
  contactAvatarUrl: string;
  method: ApplicationMethod;
  status: ApplicationStatus;
  appliedDaysAgo: number;
  lastContactDaysAgo: number;
  firstResponseDaysAgo?: number;
  nextFollowUpOffset?: number;
  notes?: string;
  emails: EmailSeed[];
  extraActivities?: ActivitySeed[];
};

const apps: AppSeed[] = [
  {
    company: "Linear",
    website: "https://linear.app",
    position: "Product Design Intern",
    location: "Remote",
    contactName: "Maya Chen",
    contactEmail: "maya.chen@example.com",
    contactAvatarUrl: "/avatars/w68.jpg",
    method: "cold_email",
    status: "interview",
    appliedDaysAgo: 24,
    lastContactDaysAgo: 2,
    firstResponseDaysAgo: 6,
    notes: "Interview with the design lead on Thursday. Review Linear's 2025 release notes and prepare questions about craft and design systems.",
    emails: [
      {
        direction: "outbound",
        kind: "initial",
        daysAgo: 24,
        subject: "Product design at Linear — a quick note",
        body: `Hi Maya,

I'm Elena, a product design student who has spent the last year obsessing over tools that make focused work feel effortless. Linear's attention to interaction detail is a constant reference point for me.

I'd love to be considered for the Product Design Intern role. I've attached a short portfolio and would be glad to walk through how I think about systems, motion, and the tiny moments that make software feel fast.

Best,
Elena`,
      },
      {
        direction: "inbound",
        kind: "reply",
        daysAgo: 6,
        subject: "Re: Product design at Linear — a quick note",
        body: `Hi Elena,

Thanks for reaching out — your portfolio is lovely. We'd like to learn more about how you approach product design. Are you free for a 30 minute conversation with me and our design lead next week?

Best,
Maya`,
      },
      {
        direction: "outbound",
        kind: "reply",
        daysAgo: 5,
        subject: "Re: Product design at Linear — a quick note",
        body: `Hi Maya,

Thank you — I'd love that. Thursday afternoon works well for me. Looking forward to it.

Best,
Elena`,
      },
    ],
    extraActivities: [
      {
        type: "interview_scheduled",
        title: "Interview scheduled",
        description: "30 minute portfolio conversation with Maya Chen and the design lead.",
        daysAgo: 4,
        hour: 15,
      },
      {
        type: "note_added",
        title: "Prep notes added",
        description: "Review Linear's keyboard-first workflows and prepare 3 questions about design systems.",
        daysAgo: 1,
        hour: 17,
      },
    ],
  },
  {
    company: "Figma",
    website: "https://figma.com",
    position: "Software Engineering Intern",
    location: "San Francisco, CA",
    contactName: "Noah Williams",
    contactEmail: "noah.williams@example.com",
    contactAvatarUrl: "/avatars/m32.jpg",
    method: "job_portal",
    status: "assessment",
    appliedDaysAgo: 18,
    lastContactDaysAgo: 3,
    firstResponseDaysAgo: 7,
    notes: "Take-home is a collaborative canvas prototype. Due in four days.",
    emails: [
      {
        direction: "outbound",
        kind: "initial",
        daysAgo: 18,
        subject: "Application — Software Engineering Intern",
        body: `Hi Noah,

I just applied for the Software Engineering Intern role through the Figma careers site. I've been building small collaborative tools for the last two years, and I'd love to bring that energy to the editor team.

My portfolio and GitHub are included in the application. Thank you for your time.

Best,
Elena`,
      },
      {
        direction: "inbound",
        kind: "reply",
        daysAgo: 7,
        subject: "Next steps — Figma Software Engineering Intern",
        body: `Hi Elena,

Thanks for applying! Your background looks like a good fit. We'd like to move you forward to the technical assessment. You'll receive a separate email with the details shortly.

Best,
Noah`,
      },
      {
        direction: "inbound",
        kind: "assessment",
        daysAgo: 3,
        subject: "Your Figma take-home assessment",
        body: `Hi Elena,

Here is your take-home assessment. Please build a small collaborative canvas feature and send it back within five days.

Good luck!
Recruiting Team`,
      },
    ],
    extraActivities: [
      {
        type: "status_changed",
        title: "Moved to Assessment",
        description: "Technical take-home received.",
        daysAgo: 3,
        hour: 11,
      },
    ],
  },
  {
    company: "Notion",
    website: "https://notion.so",
    position: "Product Management Intern",
    location: "New York, NY",
    contactName: "Priya Raman",
    contactEmail: "priya.raman@example.com",
    contactAvatarUrl: "/avatars/w12.jpg",
    method: "cold_email",
    status: "follow_up_due",
    appliedDaysAgo: 22,
    lastContactDaysAgo: 12,
    nextFollowUpOffset: -2,
    notes: "Third and final planned follow-up is overdue. If there's still no response, consider closing this out.",
    emails: [
      {
        direction: "outbound",
        kind: "initial",
        daysAgo: 22,
        subject: "Product Management Intern — quick introduction",
        body: `Hi Priya,

I'm Elena, a product-focused student who loves turning messy workflows into calm, legible tools. Notion has been part of my daily workflow for years, and I'd be thrilled to work on the product team this summer.

I'd love to share a short breakdown of a workspace feature I prototyped recently. Would you be open to a quick conversation?

Best,
Elena`,
      },
      {
        direction: "outbound",
        kind: "follow_up",
        daysAgo: 17,
        subject: "Re: Product Management Intern — quick introduction",
        body: `Hi Priya,

Just bringing this back to your inbox. I remain very interested in the Product Management Intern role and would love to share how I think about onboarding in collaborative tools.

Best,
Elena`,
      },
      {
        direction: "outbound",
        kind: "follow_up",
        daysAgo: 12,
        subject: "Re: Product Management Intern — quick introduction",
        body: `Hi Priya,

One last note from me — I know hiring seasons are busy. If the role is still open, I'd be glad to send over a short product teardown. Either way, thank you for your time.

Best,
Elena`,
      },
    ],
  },
  {
    company: "Stripe",
    website: "https://stripe.com",
    position: "Frontend Engineering Intern",
    location: "Remote",
    contactName: "Olivia Park",
    contactEmail: "olivia.park@example.com",
    contactAvatarUrl: "/avatars/w45.jpg",
    method: "referral",
    status: "offer",
    appliedDaysAgo: 33,
    lastContactDaysAgo: 1,
    firstResponseDaysAgo: 24,
    notes: "Offer received! Decision needed by next Friday. Review compensation and team placement with Sam.",
    emails: [
      {
        direction: "outbound",
        kind: "initial",
        daysAgo: 33,
        subject: "Frontend internship — referred by Sam Rivera",
        body: `Hi Olivia,

Sam Rivera suggested I reach out after we worked together on the campus design system. I'm applying for the Frontend Engineering Intern role and would love to be considered.

I care deeply about building interfaces that feel fast, accessible, and quietly delightful. My application is attached for context.

Thank you,
Elena`,
      },
      {
        direction: "inbound",
        kind: "reply",
        daysAgo: 24,
        subject: "Re: Frontend internship — referred by Sam Rivera",
        body: `Hi Elena,

Great to hear from you — Sam speaks highly of your work. We'd like to set up an initial call. Does next Tuesday work?

Best,
Olivia`,
      },
      {
        direction: "inbound",
        kind: "interview",
        daysAgo: 14,
        subject: "Interview — Stripe Frontend Intern",
        body: `Hi Elena,

Confirming your final round on Thursday. You'll meet two engineers and a design partner. We're looking forward to it.

Olivia`,
      },
      {
        direction: "inbound",
        kind: "offer",
        daysAgo: 1,
        subject: "Your Stripe internship offer",
        body: `Hi Elena,

We're delighted to offer you the Frontend Engineering Intern position. Details are attached. Please let us know your decision by next Friday.

Warmly,
Olivia`,
      },
    ],
    extraActivities: [
      {
        type: "offer_received",
        title: "Offer received",
        description: "Frontend Engineering Intern offer received. Decision due next Friday.",
        daysAgo: 1,
        hour: 9,
      },
    ],
  },
  {
    company: "Vercel",
    website: "https://vercel.com",
    position: "Design Engineer Intern",
    location: "San Francisco, CA",
    contactName: "Lucas Meyer",
    contactEmail: "lucas.meyer@example.com",
    contactAvatarUrl: "/avatars/m11.jpg",
    method: "linkedin",
    status: "rejected",
    appliedDaysAgo: 28,
    lastContactDaysAgo: 4,
    firstResponseDaysAgo: 12,
    notes: "Rejected after final round. Feedback: strong craft, wanted more production React experience. Good relationship to keep warm.",
    emails: [
      {
        direction: "outbound",
        kind: "initial",
        daysAgo: 28,
        subject: "Design engineering at Vercel",
        body: `Hi Lucas,

I'm reaching out about the Design Engineer Intern role. I've been building interactive prototypes with Next.js and care a lot about the seam between design and implementation.

I would love to show you a couple of recent projects if there's room for another conversation.

Best,
Elena`,
      },
      {
        direction: "inbound",
        kind: "reply",
        daysAgo: 12,
        subject: "Re: Design engineering at Vercel",
        body: `Hi Elena,

Thanks for the note. We'd like to chat — can you share a few times that work next week?

Lucas`,
      },
      {
        direction: "inbound",
        kind: "rejection",
        daysAgo: 4,
        subject: "Update on your Vercel application",
        body: `Hi Elena,

Thank you for taking the time to meet the team. After careful consideration, we've decided to move forward with another candidate whose experience is a closer match for this particular role.

We enjoyed getting to know you and would encourage you to stay in touch.

Best,
Lucas`,
      },
    ],
  },
  {
    company: "Ramp",
    website: "https://ramp.com",
    position: "Data Science Intern",
    location: "New York, NY",
    contactName: "Ethan Brooks",
    contactEmail: "ethan.brooks@example.com",
    contactAvatarUrl: "/avatars/m45.jpg",
    method: "cold_email",
    status: "replied",
    appliedDaysAgo: 9,
    lastContactDaysAgo: 2,
    firstResponseDaysAgo: 2,
    nextFollowUpOffset: 3,
    notes: "Ethan asked for a writing sample and availability. Send the churn analysis PDF and propose Tuesday or Wednesday.",
    emails: [
      {
        direction: "outbound",
        kind: "initial",
        daysAgo: 9,
        subject: "Data Science Intern — a short introduction",
        body: `Hi Ethan,

I'm Elena, a data science student interested in how finance teams make faster decisions with better tooling. I built a churn model for a student-run subscription service last semester and would love to apply that curiosity at Ramp.

Would you be open to a short conversation about the Data Science Intern role?

Best,
Elena`,
      },
      {
        direction: "outbound",
        kind: "follow_up",
        daysAgo: 6,
        subject: "Re: Data Science Intern — a short introduction",
        body: `Hi Ethan,

A short follow-up on my note about the Data Science Intern role. I've since finished a churn analysis for a student subscription service and would be glad to share a one-page summary if useful.

Best,
Elena`,
      },
      {
        direction: "inbound",
        kind: "reply",
        daysAgo: 2,
        subject: "Re: Data Science Intern — a short introduction",
        body: `Hi Elena,

Thanks for reaching out. Could you share a writing sample or a short project write-up? Also, what does your availability look like next week?

Ethan`,
      },
    ],
    extraActivities: [
      {
        type: "status_changed",
        title: "Reply received",
        description: "Ethan requested a writing sample and availability.",
        daysAgo: 2,
        hour: 14,
      },
    ],
  },
  {
    company: "Anthropic",
    website: "https://anthropic.com",
    position: "Research Intern",
    location: "Remote",
    contactName: "Amara Okafor",
    contactEmail: "amara.okafor@example.com",
    contactAvatarUrl: "/avatars/w26.jpg",
    method: "job_portal",
    status: "awaiting_response",
    appliedDaysAgo: 7,
    lastContactDaysAgo: 7,
    nextFollowUpOffset: 3,
    notes: "Applied through the research internship portal. Follow up on day 10 if there is no response.",
    emails: [
      {
        direction: "outbound",
        kind: "initial",
        daysAgo: 7,
        subject: "Research Intern application — evaluation and interpretability",
        body: `Hi Amara,

I recently submitted my application for the Research Intern role. My recent work has focused on evaluating model behavior under distribution shift, and I'd be glad to share the paper or code.

Thank you for considering my application.

Best,
Elena`,
      },
    ],
  },
  {
    company: "Duolingo",
    website: "https://duolingo.com",
    position: "Growth Marketing Intern",
    location: "Pittsburgh, PA",
    contactName: "Sofia Rossi",
    contactEmail: "sofia.rossi@example.com",
    contactAvatarUrl: "/avatars/w9.jpg",
    method: "cold_email",
    status: "ghosted",
    appliedDaysAgo: 48,
    lastContactDaysAgo: 31,
    notes: "Marked as ghosted after four weeks and three follow-ups with no response. User-confirmed manually.",
    emails: [
      {
        direction: "outbound",
        kind: "initial",
        daysAgo: 48,
        subject: "Growth Marketing Intern — a note from a daily learner",
        body: `Hi Sofia,

I've been a daily Duolingo learner for 612 days, and I'd love to bring that familiarity to the Growth Marketing team. I'm applying for the Growth Marketing Intern role and would welcome the chance to share a few campaign ideas.

Best,
Elena`,
      },
      {
        direction: "outbound",
        kind: "follow_up",
        daysAgo: 43,
        subject: "Re: Growth Marketing Intern — a note from a daily learner",
        body: `Hi Sofia,

Floating this back up in case it got buried. I'd be happy to send a short teardown of the recent streak campaign.

Best,
Elena`,
      },
      {
        direction: "outbound",
        kind: "follow_up",
        daysAgo: 38,
        subject: "Re: Growth Marketing Intern — a note from a daily learner",
        body: `Hi Sofia,

Just checking in once more on the Growth Marketing Intern role. I remain very interested and would love to contribute.

Best,
Elena`,
      },
      {
        direction: "outbound",
        kind: "follow_up",
        daysAgo: 31,
        subject: "Re: Growth Marketing Intern — a note from a daily learner",
        body: `Hi Sofia,

One last follow-up from me. If the role has been filled or the timing isn't right, I completely understand. Thank you for your time.

Best,
Elena`,
      },
    ],
    extraActivities: [
      {
        type: "status_changed",
        title: "Marked as Ghosted",
        description: "Manually confirmed after 48 days and three follow-ups with no response.",
        daysAgo: 20,
        hour: 9,
        metadata: { from: "follow_up_due", to: "ghosted", confirmedByUser: true },
      },
    ],
  },
  {
    company: "Airtable",
    website: "https://airtable.com",
    position: "Product Design Intern",
    location: "San Francisco, CA",
    contactName: "Grace Liu",
    contactEmail: "grace.liu@example.com",
    contactAvatarUrl: "/avatars/w47.jpg",
    method: "referral",
    status: "interview",
    appliedDaysAgo: 14,
    lastContactDaysAgo: 1,
    firstResponseDaysAgo: 4,
    notes: "Loop scheduled for Monday. Present the internal tools case study; keep it under 15 minutes.",
    emails: [
      {
        direction: "outbound",
        kind: "initial",
        daysAgo: 14,
        subject: "Product Design Intern — introduction via Jordan Lee",
        body: `Hi Grace,

Jordan Lee suggested I reach out. I'm applying for the Product Design Intern role and would love to share my work on making complex data feel approachable.

My portfolio is here, and I'd be happy to walk through the internal tools case study.

Best,
Elena`,
      },
      {
        direction: "inbound",
        kind: "reply",
        daysAgo: 4,
        subject: "Re: Product Design Intern — introduction via Jordan Lee",
        body: `Hi Elena,

Jordan's recommendation was lovely. We'd like to invite you to a portfolio review with the team. Does Monday work?

Grace`,
      },
      {
        direction: "inbound",
        kind: "interview",
        daysAgo: 1,
        subject: "Airtable portfolio review — calendar invite",
        body: `Hi Elena,

Calendar invite attached for Monday at 1pm PT. You'll have 20 minutes to present and 25 minutes for questions. Looking forward to it!

Grace`,
      },
    ],
    extraActivities: [
      {
        type: "interview_scheduled",
        title: "Portfolio review scheduled",
        description: "Monday at 1:00 PM PT with the Airtable design team.",
        daysAgo: 1,
        hour: 13,
      },
    ],
  },
  {
    company: "Mercury",
    website: "https://mercury.com",
    position: "Software Engineering Intern",
    location: "San Francisco, CA",
    contactName: "Daniel Kim",
    contactEmail: "daniel.kim@example.com",
    contactAvatarUrl: "/avatars/m22.jpg",
    method: "job_portal",
    status: "applied",
    appliedDaysAgo: 2,
    lastContactDaysAgo: 2,
    nextFollowUpOffset: 3,
    notes: "Applied via careers page. Wait until day 5 before following up.",
    emails: [
      {
        direction: "outbound",
        kind: "initial",
        daysAgo: 2,
        subject: "Application — Software Engineering Intern",
        body: `Hi Daniel,

I just submitted my application for the Software Engineering Intern role. I'm especially interested in Mercury's approach to building calm, trustworthy financial products.

Thank you for your time and consideration.

Best,
Elena`,
      },
    ],
  },
  {
    company: "The Browser Company",
    website: "https://thebrowser.company",
    position: "UI/UX Design Intern",
    location: "New York, NY",
    contactName: "Isla Morgan",
    contactEmail: "isla.morgan@example.com",
    contactAvatarUrl: "/avatars/w33.jpg",
    method: "cold_email",
    status: "follow_up_due",
    appliedDaysAgo: 12,
    lastContactDaysAgo: 7,
    nextFollowUpOffset: 0,
    notes: "Follow-up due today. Mention the Spaces concept and the short Loom walkthrough.",
    emails: [
      {
        direction: "outbound",
        kind: "initial",
        daysAgo: 12,
        subject: "A small concept for Spaces — and the UI/UX internship",
        body: `Hi Isla,

I'm Elena, a designer who has been thinking a lot about how browsers can feel more like places than utilities. I put together a short concept for an ambient workspace feature and would love to share it as part of my application for the UI/UX Design Intern role.

Would you be open to a quick look?

Best,
Elena`,
      },
      {
        direction: "outbound",
        kind: "follow_up",
        daysAgo: 7,
        subject: "Re: A small concept for Spaces — and the UI/UX internship",
        body: `Hi Isla,

Sharing a 90-second Loom walkthrough of the concept in case it's easier to skim. I'd love to hear how your team approaches these small moments.

Best,
Elena`,
      },
    ],
  },
  {
    company: "Databricks",
    website: "https://databricks.com",
    position: "Solutions Engineering Intern",
    location: "Remote",
    contactName: "Marcus Reed",
    contactEmail: "marcus.reed@example.com",
    contactAvatarUrl: "/avatars/m54.jpg",
    method: "linkedin",
    status: "withdrawn",
    appliedDaysAgo: 21,
    lastContactDaysAgo: 10,
    notes: "Withdrew after accepting a different offer. Keep the recruiter relationship warm for next year.",
    emails: [
      {
        direction: "outbound",
        kind: "initial",
        daysAgo: 21,
        subject: "Solutions Engineering Intern — quick note",
        body: `Hi Marcus,

I'm reaching out about the Solutions Engineering Intern role. I enjoy translating technical concepts into clear, useful stories for customers and would love to learn more about the team.

Best,
Elena`,
      },
      {
        direction: "outbound",
        kind: "other",
        daysAgo: 10,
        subject: "Withdrawing my application",
        body: `Hi Marcus,

Thank you again for the conversation. I've decided to accept another offer and would like to withdraw my application. I hope we can stay in touch for future opportunities.

Best,
Elena`,
      },
    ],
    extraActivities: [
      {
        type: "withdrawn",
        title: "Application withdrawn",
        description: "Withdrew after accepting another offer.",
        daysAgo: 10,
        hour: 16,
      },
    ],
  },
  {
    company: "Superhuman",
    website: "https://superhuman.com",
    position: "Product Design Intern",
    location: "Remote",
    contactName: "Chloe Bennett",
    contactEmail: "chloe.bennett@example.com",
    contactAvatarUrl: "/avatars/w41.jpg",
    method: "cold_email",
    status: "assessment",
    appliedDaysAgo: 20,
    lastContactDaysAgo: 4,
    firstResponseDaysAgo: 9,
    notes: "Design exercise: reimagine the follow-up experience. Spend no more than four hours.",
    emails: [
      {
        direction: "outbound",
        kind: "initial",
        daysAgo: 20,
        subject: "Product Design Intern — a quick thought on speed",
        body: `Hi Chloe,

I'm Elena, a product design student who cares about the feeling of speed in software. Superhuman's keyboard-first approach has shaped how I think about reducing friction, and I'd love to join the Product Design team this summer.

I've attached a short case study on designing for flow. Would you be open to chat?

Best,
Elena`,
      },
      {
        direction: "inbound",
        kind: "reply",
        daysAgo: 9,
        subject: "Re: Product Design Intern — a quick thought on speed",
        body: `Hi Elena,

Thanks for the thoughtful note and case study. We'd like to move you to the design exercise stage. You'll receive the brief shortly.

Chloe`,
      },
      {
        direction: "inbound",
        kind: "assessment",
        daysAgo: 4,
        subject: "Your Superhuman design exercise",
        body: `Hi Elena,

Attached is the design exercise. We're asking candidates to reimagine the follow-up experience. Please spend no more than four hours and send it back by Friday.

Good luck!
Chloe`,
      },
    ],
  },
  {
    company: "Retool",
    website: "https://retool.com",
    position: "Software Engineering Intern",
    location: "San Francisco, CA",
    contactName: "Ben Carter",
    contactEmail: "ben.carter@example.com",
    contactAvatarUrl: "/avatars/m18.jpg",
    method: "referral",
    status: "replied",
    appliedDaysAgo: 5,
    lastContactDaysAgo: 1,
    firstResponseDaysAgo: 1,
    nextFollowUpOffset: 4,
    notes: "Ben is forwarding my application to the platform team. Follow up after the long weekend.",
    emails: [
      {
        direction: "outbound",
        kind: "initial",
        daysAgo: 5,
        subject: "Software Engineering Intern — intro from Ben Carter",
        body: `Hi Ben,

Ben suggested I reach out about the Software Engineering Intern role. I've spent the last semester building internal tools for a research lab and would love to bring that experience to Retool.

My application is attached — thank you for your time.

Best,
Elena`,
      },
      {
        direction: "inbound",
        kind: "reply",
        daysAgo: 1,
        subject: "Re: Software Engineering Intern — intro from Ben Carter",
        body: `Hi Elena,

Thanks for sending this over. I'm forwarding your application to the platform team. I'll let you know as soon as I hear back.

Ben`,
      },
    ],
  },
  {
    company: "Loom",
    website: "https://loom.com",
    position: "Content Design Intern",
    location: "Remote",
    contactName: "Hana Sato",
    contactEmail: "hana.sato@example.com",
    contactAvatarUrl: "/avatars/w63.jpg",
    method: "cold_email",
    status: "awaiting_response",
    appliedDaysAgo: 1,
    lastContactDaysAgo: 1,
    nextFollowUpOffset: 4,
    notes: "Initial outreach sent. Follow up on day 5 with the onboarding copy sample.",
    emails: [
      {
        direction: "outbound",
        kind: "initial",
        daysAgo: 1,
        subject: "Content Design Intern — a note about clarity at speed",
        body: `Hi Hana,

I'm Elena, a writer and designer focused on making complex products feel simple. I've been collecting examples of Loom's microcopy for a while, and I'd love to contribute as a Content Design Intern.

I've included a short sample of onboarding copy I rewrote for a student project. Would you be open to a conversation?

Best,
Elena`,
      },
    ],
  },
];

export async function seedDemoData(db: Db, force = false) {
  const existing = await db.query.users.findFirst({
    where: eq(users.email, DEMO_EMAIL),
  });

  if (existing && !force) return existing;
  if (existing && force) {
    await db.delete(users).where(eq(users.id, existing.id));
  }

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const [demoUser] = await db
    .insert(users)
    .values({
      email: DEMO_EMAIL,
      name: DEMO_NAME,
      avatarUrl: DEMO_AVATAR,
      passwordHash,
      isDemo: true,
    })
    .returning();

  await db.insert(settings).values({
    userId: demoUser.id,
    followUpIntervals: [5, 10, 17],
    emailSignature: "Elena Crutiez\nProduct designer & builder\nelena@internshiptracker.app",
    defaultMethod: "cold_email",
  });

  await db.insert(templates).values(
    DEFAULT_TEMPLATES.map((template) => ({
      ...template,
      userId: demoUser.id,
    })),
  );

  for (const seed of apps) {
    const [company] = await db
      .insert(companies)
      .values({
        userId: demoUser.id,
        name: seed.company,
        website: seed.website,
        domain: new URL(seed.website).hostname.replace(/^www\./, ""),
      })
      .returning();

    const [application] = await db
      .insert(applications)
      .values({
        userId: demoUser.id,
        companyId: company.id,
        position: seed.position,
        location: seed.location,
        contactName: seed.contactName,
        contactEmail: seed.contactEmail,
        contactAvatarUrl: seed.contactAvatarUrl,
        method: seed.method,
        status: seed.status,
        appliedAt: dateOnly(at(seed.appliedDaysAgo, 9)),
        lastContactAt: at(seed.lastContactDaysAgo, 14),
        firstResponseAt:
          seed.firstResponseDaysAgo !== undefined ? at(seed.firstResponseDaysAgo, 11) : null,
        nextFollowUpAt:
          seed.nextFollowUpOffset !== undefined
            ? dateOnly(inDays(seed.nextFollowUpOffset))
            : null,
        notes: seed.notes,
        createdAt: at(seed.appliedDaysAgo, 9),
      })
      .returning();

    await db.insert(activities).values({
      userId: demoUser.id,
      applicationId: application.id,
      type: "application_created",
      title: "Application created",
      description: `Applied for ${seed.position} at ${seed.company}.`,
      occurredAt: at(seed.appliedDaysAgo, 9),
    });

    for (const email of seed.emails) {
      const [savedEmail] = await db
        .insert(emailInteractions)
        .values({
          userId: demoUser.id,
          applicationId: application.id,
          direction: email.direction,
          kind: email.kind,
          subject: email.subject,
          body: email.body,
          fromEmail:
            email.direction === "outbound" ? DEMO_EMAIL : seed.contactEmail,
          toEmail:
            email.direction === "outbound" ? seed.contactEmail : DEMO_EMAIL,
          occurredAt: at(email.daysAgo, email.hour ?? 10),
        })
        .returning();

      await db.insert(activities).values({
        userId: demoUser.id,
        applicationId: application.id,
        emailId: savedEmail.id,
        type:
          email.direction === "outbound"
            ? email.kind === "follow_up"
              ? "follow_up_sent"
              : "email_sent"
            : email.kind === "interview"
              ? "interview_scheduled"
              : email.kind === "assessment"
                ? "assessment_received"
                : email.kind === "offer"
                  ? "offer_received"
                  : email.kind === "rejection"
                    ? "rejection_received"
                    : "reply_received",
        title:
          email.direction === "outbound"
            ? email.kind === "follow_up"
              ? "Follow-up sent"
              : email.kind === "initial"
                ? "Initial email sent"
                : "Email sent"
            : email.kind === "reply"
              ? "Reply received"
              : email.kind === "interview"
                ? "Interview invitation"
                : email.kind === "assessment"
                  ? "Assessment received"
                  : email.kind === "offer"
                    ? "Offer received"
                    : email.kind === "rejection"
                      ? "Rejection received"
                      : "Email received",
        description: email.subject,
        occurredAt: at(email.daysAgo, (email.hour ?? 10) + 1),
      });
    }

    if (seed.extraActivities) {
      for (const extra of seed.extraActivities) {
        await db.insert(activities).values({
          userId: demoUser.id,
          applicationId: application.id,
          type: extra.type,
          title: extra.title,
          description: extra.description,
          metadata: extra.metadata,
          occurredAt: at(extra.daysAgo, extra.hour ?? 12),
        });
      }
    }
  }

  return demoUser;
}

export { DEMO_EMAIL };
