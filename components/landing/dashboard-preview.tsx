import {
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  CalendarClock,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Mail,
  Search,
  Settings,
} from "lucide-react";
import { LogoMark } from "@/components/logo";

const menu = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Applications", icon: Briefcase },
  { label: "Follow-ups", icon: CalendarClock },
  { label: "Emails", icon: Mail },
  { label: "Templates", icon: FileText },
  { label: "Companies", icon: Building2 },
  { label: "Analytics", icon: BarChart3 },
];

const rows = [
  { company: "Loom", role: "Content Design Intern", status: "Interview", tone: "bg-[#ece9fb] text-[#6d5bb7]" },
  { company: "Mercury", role: "Product Design Intern", status: "Replied", tone: "bg-[#e8f4fb] text-[#357da2]" },
  { company: "Retool", role: "Design Intern", status: "Applied", tone: "bg-[#f0f1f2] text-[#6d7278]" },
];

export function LandingDashboardPreview() {
  return (
    <div
      aria-hidden="true"
      className="flex h-full w-full select-none overflow-hidden rounded-[11px] border border-white/70 bg-white text-[#17171c] shadow-[0_24px_70px_rgba(30,50,70,0.2)]"
    >
      <aside className="flex w-[36%] shrink-0 flex-col border-r border-[#ededef] bg-[#fbfbfb] px-[11px] py-[12px]">
        <div className="flex items-center gap-1.5">
          <LogoMark className="h-[13px] w-[10px]" />
          <span className="text-[9px] font-semibold tracking-[-0.03em]">Pursuit</span>
        </div>

        <p className="mb-1 mt-5 pl-1 text-[5.5px] font-medium uppercase tracking-[0.13em] text-[#a5a5ac]">
          Menu
        </p>
        <nav className="space-y-[2px]">
          {menu.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`flex h-[19px] items-center gap-1.5 rounded-[4px] px-1.5 text-[7px] ${
                  item.active
                    ? "border border-[#e8e8eb] bg-white text-[#17171c] shadow-[0_1px_1px_rgba(0,0,0,0.03)]"
                    : "text-[#6c6c74]"
                }`}
              >
                <Icon className="size-[8px]" strokeWidth={1.7} />
                {item.label}
              </div>
            );
          })}
        </nav>

        <p className="mb-1 mt-4 pl-1 text-[5.5px] font-medium uppercase tracking-[0.13em] text-[#a5a5ac]">
          General
        </p>
        <nav className="space-y-[2px]">
          <div className="flex h-[18px] items-center gap-1.5 px-1.5 text-[7px] text-[#6c6c74]">
            <Settings className="size-[8px]" strokeWidth={1.7} />
            Settings
          </div>
          <div className="flex h-[18px] items-center gap-1.5 px-1.5 text-[7px] text-[#6c6c74]">
            <HelpCircle className="size-[8px]" strokeWidth={1.7} />
            Help Center
          </div>
        </nav>

        <div className="mt-auto rounded-[6px] border border-[#e8e8eb] bg-white p-2 shadow-[0_1px_2px_rgba(0,0,0,0.025)]">
          <p className="text-[6px] font-medium text-[#4f4f56]">Your workspace</p>
          <p className="mt-0.5 text-[5.5px] leading-relaxed text-[#9a9aa1]">
            15 applications tracked
          </p>
          <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-[#f0f0f2]">
            <div className="h-full w-[68%] rounded-full bg-[#17171c]" />
          </div>
          <div className="mt-1.5 flex h-[17px] items-center justify-center rounded-[3px] bg-[#111113] text-[5.5px] font-medium text-white">
            Open workspace
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 bg-white px-[14px] py-[11px]">
        <div className="flex items-center justify-between">
          <p className="text-[8px] font-medium text-[#2c2c32]">Overview</p>
          <div className="flex items-center gap-2 text-[#a4a4aa]">
            <Search className="size-[8px]" strokeWidth={1.7} />
            <Bell className="size-[8px]" strokeWidth={1.7} />
          </div>
        </div>

        <div className="mt-4">
          <p className="text-[15px] font-medium tracking-[-0.035em] text-[#17171c]">
            Good morning, Elena
          </p>
          <p className="mt-1 text-[6.5px] text-[#8e8e96]">
            Here&apos;s how your internship search is moving today.
          </p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-[6px] border border-[#ececef] p-2">
            <p className="text-[5.5px] text-[#9999a1]">Total applications</p>
            <div className="mt-1 flex items-end justify-between gap-2">
              <p className="text-[14px] font-medium leading-none tracking-[-0.04em]">15</p>
              <span className="flex items-center gap-0.5 text-[5px] text-[#42936d]">
                <span className="size-[3px] rounded-full bg-[#63ae88]" />
                11 active
              </span>
            </div>
            <svg viewBox="0 0 70 16" className="mt-1 h-[12px] w-full text-[#6a6a72]">
              <path
                d="M1 12 8 9 15 11 22 6 29 8 36 4 43 7 50 5 57 8 64 3 69 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="rounded-[6px] border border-[#ececef] p-2">
            <p className="text-[5.5px] text-[#9999a1]">Responses received</p>
            <div className="mt-1 flex items-end justify-between gap-2">
              <p className="text-[14px] font-medium leading-none tracking-[-0.04em]">8</p>
              <span className="flex items-center gap-0.5 rounded-[2px] bg-[#eaf5ef] px-1 py-0.5 text-[5px] text-[#42936d]">
                53% rate
              </span>
            </div>
            <svg viewBox="0 0 70 16" className="mt-1 h-[12px] w-full text-[#b7b7be]">
              <path
                d="M1 13 8 10 15 12 22 9 29 11 36 7 43 9 50 5 57 7 64 4 69 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <div className="mt-3 rounded-[6px] border border-[#ececef] p-2">
          <div className="flex items-center justify-between">
            <p className="text-[7px] font-medium text-[#4b4b52]">Application activity</p>
            <span className="text-[5px] text-[#a1a1a8]">Last 7 months</span>
          </div>
          <div className="mt-2 flex h-[56px] items-end gap-[7px]">
            {[32, 48, 38, 67, 50, 78, 59].map((height, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t-[2px] ${index % 2 === 0 ? "bg-[#17171c]" : "bg-[#d9d9dd]"}`}
                  style={{ height: `${height}%` }}
                />
                <span className="text-[4.5px] text-[#a1a1a8]">
                  {["Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"][index]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 overflow-hidden rounded-[6px] border border-[#ececef]">
          <div className="flex items-center justify-between border-b border-[#f0f0f2] px-2 py-1.5">
            <p className="text-[7px] font-medium text-[#4b4b52]">Recent applications</p>
            <span className="text-[5px] text-[#a1a1a8]">View all</span>
          </div>
          {rows.map((row) => (
            <div
              key={row.company}
              className="flex items-center gap-2 border-b border-[#f4f4f5] px-2 py-1.5 last:border-b-0"
            >
              <span className="grid size-[14px] shrink-0 place-items-center rounded-full bg-[#f2f2f3] text-[5px] font-medium text-[#5d5d65]">
                {row.company.slice(0, 1)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[6.5px] font-medium text-[#33333a]">{row.company}</p>
                <p className="truncate text-[5.5px] text-[#9b9ba2]">{row.role}</p>
              </div>
              <span className={`rounded-[2px] px-1 py-0.5 text-[4.8px] ${row.tone}`}>
                {row.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
