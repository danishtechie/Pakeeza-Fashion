"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ivory px-4 text-center">
          <p className="text-sm uppercase tracking-widest2 text-gold">Something went wrong</p>
          <h1 className="font-serif text-3xl text-charcoal">We hit a snag</h1>
          <p className="max-w-sm text-sm text-charcoal/60">
            Please try again. If the problem continues, reach out to us on WhatsApp.
          </p>
          <button onClick={() => reset()} className="rounded-full bg-charcoal px-6 py-2.5 text-sm text-ivory hover:bg-black">
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
