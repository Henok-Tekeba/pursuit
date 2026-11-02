import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { AuthFooter } from "./auth-footer";

export function AuthShell({
  children,
  wide = false,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="min-h-dvh bg-[#f6f1e6] text-[#101012]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1440px] lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="relative flex min-h-dvh flex-col px-6 pb-7 pt-7 md:px-11 lg:min-h-0">
          <header className="flex items-center justify-between">
            <Link href="/" aria-label="Pursuit home" className="flex items-center gap-2">
              <LogoMark className="h-[23px] w-[18px]" />
              <span className="text-[16px] font-semibold tracking-[-0.04em]">Pursuit</span>
            </Link>
            <Link
              href="/"
              className="text-[12px] text-[#77777d] underline-offset-4 transition-colors hover:text-[#101012] hover:underline"
            >
              Back to home
            </Link>
          </header>

          <main
            className={`flex w-full flex-1 flex-col justify-center py-12 ${
              wide ? "max-w-[620px]" : "max-w-[400px]"
            }`}
          >
            {children}
          </main>

          <div className="pt-6">
            <AuthFooter />
          </div>
        </div>

        <aside className="relative m-6 ml-0 hidden overflow-hidden rounded-[14px] lg:block">
          <AuthBackdrop />
          <div className="relative flex h-full flex-col justify-between p-10 xl:p-12">
            <p className="flex items-center gap-2 text-[11px] text-[#101012]/55">
              <span className="size-1.5 rounded-full bg-[#101012]/50" />
              The internship workspace
            </p>

            <div className="max-w-[430px]">
              <p className="text-[40px] font-medium leading-[1.06] tracking-[-0.055em] text-[#101012] xl:text-[46px]">
                A calmer way to run your internship search.
              </p>
              <p className="mt-5 max-w-[340px] text-[13px] leading-[1.65] text-[#39464f]/75">
                Applications, emails, follow-ups, and interviews in one private place. Less
                scrambling, more signal.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                {["Private by default", "No ads", "Google sign-in"].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-black/[0.08] bg-white/30 px-3 py-1.5 text-[10.5px] text-[#101012]/60"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <p className="flex items-center gap-2 text-[10.5px] text-[#101012]/45">
              <LogoMark className="h-3.5 w-3" />
              Built for the internship search.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function AuthBackdrop() {
  return (
    <>
      <div className="absolute inset-0 bg-[linear-gradient(155deg,#8dc9ec_0%,#b9def3_30%,#e8d9d8_64%,#f5e5d2_100%)]" />
      <div className="absolute -left-16 top-[18%] h-[28%] w-[58%] rounded-full bg-white/45 blur-[32px]" />
      <div className="absolute -right-20 top-[3%] h-[34%] w-[64%] rounded-full bg-[#f6c4ba]/55 blur-[42px]" />
      <div className="absolute -bottom-24 left-[8%] h-[44%] w-[82%] rounded-full bg-[#f6d7b2]/75 blur-[44px]" />
      <div className="absolute right-[18%] top-[42%] h-[18%] w-[34%] rounded-full bg-white/30 blur-[26px]" />
    </>
  );
}
