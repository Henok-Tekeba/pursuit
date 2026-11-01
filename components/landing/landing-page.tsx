import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Briefcase,
  CalendarClock,
  Check,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { LogoMark } from "@/components/logo";
import { LandingDashboardPreview } from "./dashboard-preview";

const nav = [
  { label: "Why Pursuit", href: "#why" },
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Demo", href: "/demo" },
  {
    label: "Changelog",
    href: "https://github.com/Henok-Tekeba/pursuit/releases",
    external: true,
  },
];

const features = [
  {
    icon: Briefcase,
    title: "One home for every application",
    body: "Company, role, contact, source, notes, and the exact email you sent — attached to one record instead of scattered across tabs.",
  },
  {
    icon: CalendarClock,
    title: "Follow-ups that don't slip",
    body: "Set your cadence once. Pursuit surfaces what is due, what is overdue, and what to send next without turning your inbox into a guilt trip.",
  },
  {
    icon: Mail,
    title: "The conversation stays intact",
    body: "Initial emails, replies, interview notes, and offers live together in a readable timeline. No more searching for the thread.",
  },
  {
    icon: BarChart3,
    title: "See what is actually working",
    body: "Response rate, interviews, offers, and follow-up effectiveness — the signal you need to adjust your search with intent.",
  },
];

const steps = [
  {
    number: "01",
    title: "Continue with Google",
    body: "Your email is verified by Google. No password to remember and no email setup to babysit.",
  },
  {
    number: "02",
    title: "Make the workspace yours",
    body: "Add your target role, school, graduation year, and the kind of search you are running.",
  },
  {
    number: "03",
    title: "Run the search",
    body: "Track applications, send thoughtful follow-ups, and let the timeline remember the details.",
  },
];

export function LandingPage({ isAuthed }: { isAuthed: boolean }) {
  const primaryHref = isAuthed ? "/dashboard" : "/signup";
  const primaryLabel = isAuthed ? "Open dashboard" : "Start for free";

  return (
    <main className="min-h-dvh bg-[#fafaf9] text-[#101012]">
      <section className="relative mx-auto min-h-dvh w-full max-w-[1440px] overflow-hidden">
        <div className="absolute inset-y-[26px] left-[50.6%] right-[42px] hidden overflow-hidden rounded-[12px] lg:block">
          <LandingBackdrop />
          <div className="absolute bottom-[6%] left-[15%] right-[-8%] top-[10%]">
            <LandingDashboardPreview />
          </div>
        </div>

        <div className="relative flex min-h-dvh w-full flex-col px-6 pb-10 md:px-11 lg:w-[50.6%] lg:pb-0">
          <header className="flex items-center justify-between pt-[26px]">
            <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Pursuit home">
              <LogoMark className="h-[23px] w-[18px]" />
              <span className="text-[16px] font-semibold tracking-[-0.04em]">Pursuit</span>
            </Link>

            <nav className="hidden items-center gap-3 md:flex">
              {nav.map((item) =>
                item.external ? (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[12.5px] text-[#66666c] transition-colors hover:text-[#101012]"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-[12.5px] text-[#66666c] transition-colors hover:text-[#101012]"
                  >
                    {item.label}
                  </Link>
                ),
              )}
            </nav>

            <Link
              href={isAuthed ? "/dashboard" : "/login"}
              className="ml-4 shrink-0 text-[12px] font-medium text-[#101012] underline-offset-4 hover:underline"
            >
              {isAuthed ? "Open app" : "Log in"}
            </Link>
          </header>

          <div className="flex flex-1 flex-col justify-center pb-4 pt-14 lg:justify-end lg:pb-[60px] lg:pt-0">
            <div className="inline-flex items-center gap-1.5 self-start text-[11px] font-medium text-[#5f5f66]">
              <Sparkles className="size-3.5" strokeWidth={1.8} />
              Google-verified · private by default
            </div>

            <h1 className="mt-5 max-w-[540px] text-[clamp(42px,4vw,54px)] font-medium leading-[1.03] tracking-[-0.055em] text-[#101012]">
              The all-in-one CRM
              <br />
              <span className="text-[#8d8d91]">for a smarter</span>
              <br />
              <span className="text-[#8d8d91]">internship search.</span>
            </h1>

            <p className="mt-5 max-w-[408px] text-[14px] leading-[1.6] text-[#858589]">
              Track every application, email, and follow-up in one calm workspace — and spend
              your energy on the conversations that matter.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href={primaryHref}
                className="inline-flex h-[40px] items-center gap-2 rounded-[7px] bg-[#101012] px-5 text-[12px] font-medium text-white transition-opacity hover:opacity-85"
              >
                {primaryLabel}
                <ArrowRight className="size-3.5" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex h-[40px] items-center rounded-[7px] bg-[#efefed] px-5 text-[12px] font-medium text-[#101012] transition-colors hover:bg-[#e8e8e5]"
              >
                View demo
              </Link>
            </div>

            <p className="mt-4 flex items-center gap-1.5 text-[10.5px] text-[#a0a0a5]">
              <ShieldCheck className="size-3" />
              Your workspace is private. No ads, no data selling.
            </p>
          </div>

          <div className="relative mt-4 h-[430px] overflow-hidden rounded-[12px] lg:hidden">
            <LandingBackdrop />
            <div className="absolute bottom-[8%] left-[8%] right-[-16%] top-[8%]">
              <LandingDashboardPreview />
            </div>
          </div>
        </div>
      </section>

      <section id="why" className="border-t border-[#ececea] bg-[#fafaf9]">
        <div className="mx-auto grid w-full max-w-[1200px] gap-10 px-6 py-20 md:grid-cols-[0.85fr_1.15fr] md:px-11 md:py-28">
          <div>
            <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-[#a0a0a5]">
              Why Pursuit
            </p>
            <h2 className="mt-4 max-w-[360px] text-[34px] font-medium leading-[1.08] tracking-[-0.045em] md:text-[42px]">
              Your search deserves a system, not a spreadsheet.
            </h2>
          </div>
          <div className="max-w-[560px] md:pt-8">
            <p className="text-[15px] leading-[1.7] text-[#65656c]">
              Internship applications are relationship work. The value is not in how many rows you
              collect — it is in remembering who you spoke to, what you said, and when to follow up
              without sounding like a robot.
            </p>
            <p className="mt-4 text-[15px] leading-[1.7] text-[#65656c]">
              Pursuit keeps the human context attached to the process. It is intentionally quiet,
              intentionally private, and designed to make the next right action obvious.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {["No ads", "No shared workspace", "No fake urgency"].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e5e2] bg-white px-3 py-1.5 text-[10.5px] text-[#65656c]"
                >
                  <Check className="size-3 text-[#4c946c]" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-[#ececea] bg-white">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-20 md:px-11 md:py-28">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-[#a0a0a5]">
                What is inside
              </p>
              <h2 className="mt-4 max-w-[560px] text-[34px] font-medium leading-[1.08] tracking-[-0.045em] md:text-[42px]">
                A quiet operating system for the whole search.
              </h2>
            </div>
            <Link
              href={primaryHref}
              className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-[#101012] underline-offset-4 hover:underline"
            >
              {primaryLabel}
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <div className="mt-12 grid gap-3 sm:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="rounded-[12px] border border-[#ececea] bg-[#fafaf9] p-5 transition-colors hover:border-[#dededb]"
                >
                  <span className="grid size-8 place-items-center rounded-lg border border-[#e8e8e5] bg-white text-[#5f5f66]">
                    <Icon className="size-4" strokeWidth={1.7} />
                  </span>
                  <h3 className="mt-5 text-[15px] font-medium tracking-[-0.02em]">{feature.title}</h3>
                  <p className="mt-2 max-w-[430px] text-[12.5px] leading-[1.65] text-[#77777d]">
                    {feature.body}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-t border-[#ececea] bg-[#fafaf9]">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-20 md:px-11 md:py-28">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-[#a0a0a5]">
            How it works
          </p>
          <h2 className="mt-4 max-w-[500px] text-[34px] font-medium leading-[1.08] tracking-[-0.045em] md:text-[42px]">
            Set it up once. Then just run your search.
          </h2>

          <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-5">
            {steps.map((step) => (
              <div key={step.number} className="border-t border-[#dededb] pt-4">
                <p className="text-[10px] font-medium tracking-[0.12em] text-[#a0a0a5]">
                  {step.number}
                </p>
                <h3 className="mt-4 text-[17px] font-medium tracking-[-0.025em]">{step.title}</h3>
                <p className="mt-2 max-w-[300px] text-[12.5px] leading-[1.65] text-[#77777d]">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-[1200px] px-6 pb-20 md:px-11 md:pb-28">
          <div className="relative overflow-hidden rounded-[14px] bg-[#101012] px-7 py-12 text-white md:px-12 md:py-16">
            <div className="absolute -right-16 -top-24 size-72 rounded-full bg-[#f0b8a8]/20 blur-3xl" />
            <div className="absolute -bottom-24 left-1/3 size-64 rounded-full bg-[#90c8e4]/20 blur-3xl" />
            <div className="relative flex flex-wrap items-end justify-between gap-8">
              <div>
                <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-white/50">
                  Your next chapter
                </p>
                <h2 className="mt-3 max-w-[560px] text-[32px] font-medium leading-[1.08] tracking-[-0.045em] md:text-[44px]">
                  Make the search feel like a system, not a scramble.
                </h2>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <Link
                  href={primaryHref}
                  className="inline-flex h-[40px] items-center gap-2 rounded-[7px] bg-white px-5 text-[12px] font-medium text-[#101012] transition-opacity hover:opacity-85"
                >
                  {primaryLabel}
                  <ArrowRight className="size-3.5" />
                </Link>
                <Link
                  href="/demo"
                  className="inline-flex h-[40px] items-center rounded-[7px] border border-white/20 px-5 text-[12px] font-medium text-white transition-colors hover:bg-white/10"
                >
                  View the demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#ececea] bg-[#fafaf9]">
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center gap-4 px-6 py-6 text-[10.5px] text-[#99999f] md:px-11">
          <span className="flex items-center gap-1.5 font-medium text-[#55555c]">
            <LogoMark className="h-3.5 w-3" />
            Pursuit
          </span>
          <span className="hidden h-3 w-px bg-[#dededb] sm:block" />
          <span>Built for the internship search.</span>
          <nav className="ml-auto flex items-center gap-4">
            <Link href="/privacy" className="transition-colors hover:text-[#101012]">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-[#101012]">
              Terms
            </Link>
            <a
              href="https://github.com/Henok-Tekeba/pursuit"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-[#101012]"
            >
              GitHub
            </a>
          </nav>
        </div>
      </footer>
    </main>
  );
}

function LandingBackdrop() {
  return (
    <>
      <div className="absolute inset-0 bg-[linear-gradient(155deg,#8dc9ec_0%,#b9def3_30%,#e8d9d8_64%,#f5e5d2_100%)]" />
      <div className="absolute -left-16 top-[18%] h-[28%] w-[58%] rounded-full bg-white/45 blur-[32px]" />
      <div className="absolute -right-20 top-[3%] h-[34%] w-[64%] rounded-full bg-[#f6c4ba]/55 blur-[42px]" />
      <div className="absolute -bottom-20 left-[8%] h-[42%] w-[82%] rounded-full bg-[#f6d7b2]/75 blur-[44px]" />
      <div className="absolute right-[18%] top-[38%] h-[18%] w-[34%] rounded-full bg-white/30 blur-[26px]" />
    </>
  );
}
