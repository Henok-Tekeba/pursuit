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
    <div className="auth-canvas flex min-h-dvh items-center justify-center p-0 md:p-6">
      <div
        className={`flex min-h-dvh w-full flex-col overflow-hidden bg-white md:min-h-[740px] md:flex-row md:rounded-[3px] md:shadow-[0_2px_10px_rgba(0,0,0,0.06)] ${
          wide ? "max-w-[1120px]" : "max-w-[1040px]"
        }`}
      >
        <div className="relative flex min-h-dvh w-full flex-col items-center bg-white px-6 pb-16 pt-9 md:min-h-0 md:w-1/2 md:px-12 md:pb-0 md:pt-9">
          <Link href="/login" aria-label="Pursuit home" className="relative z-10">
            <LogoMark className="h-[30px] w-[23px] text-[#0b0b0c]" />
          </Link>

          <div
            className={`flex w-full flex-1 flex-col justify-center pb-8 pt-10 md:pb-16 md:pt-0 ${
              wide ? "md:w-[470px]" : "md:w-[380px]"
            }`}
          >
            {children}
          </div>

          <div className="absolute inset-x-0 bottom-6">
            <AuthFooter />
          </div>
        </div>

        <div className="relative hidden w-1/2 overflow-hidden md:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/auth-halftone.jpg"
            alt="A halftone landscape of trees reflected in still water"
            className="auth-halftone h-full w-full object-cover object-center"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
