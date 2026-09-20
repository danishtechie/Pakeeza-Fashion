import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="eyebrow">404</p>
      <h1 className="section-heading">Page Not Found</h1>
      <p className="max-w-sm text-sm text-charcoal/60">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link href="/" className="rounded-full bg-charcoal px-6 py-2.5 text-sm text-ivory hover:bg-forest">
        Back to Home
      </Link>
    </div>
  );
}
