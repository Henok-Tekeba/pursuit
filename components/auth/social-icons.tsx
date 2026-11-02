export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.85 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.67-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.06L5.85 9.9C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

export function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M17.05 12.54c-.03-2.9 2.37-4.3 2.48-4.37-1.35-1.97-3.45-2.24-4.2-2.27-1.79-.18-3.49 1.05-4.4 1.05-.9 0-2.3-1.02-3.78-1-1.94.03-3.73 1.13-4.72 2.86-2.01 3.49-.51 8.66 1.45 11.5.96 1.39 2.11 2.95 3.62 2.89 1.45-.06 2-.94 3.75-.94 1.75 0 2.24.94 3.77.91 1.55-.03 2.54-1.42 3.49-2.82 1.1-1.61 1.55-3.17 1.58-3.25-.03-.02-3.03-1.17-3.06-4.56ZM14.2 3.9c.8-.97 1.34-2.32 1.19-3.66-1.15.05-2.55.77-3.38 1.74-.74.85-1.39 2.22-1.21 3.53 1.29.1 2.6-.65 3.4-1.61Z" />
    </svg>
  );
}

export function GoogleCalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect x="2.5" y="2.5" width="19" height="19" rx="2.5" fill="#4285F4" />
      <rect x="5.5" y="6.5" width="13" height="12" rx="1" fill="#FFFFFF" />
      <text
        x="12"
        y="15.7"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="7.5"
        fontWeight="700"
        fill="#4285F4"
      >
        31
      </text>
    </svg>
  );
}
