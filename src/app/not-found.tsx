import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <Logo href="/" />
      <h1 className="mt-8 text-3xl font-bold text-heading">This page is not available</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted">
        The link may be out of date. Return to the dashboard or the public overview.
      </p>
      <div className="mt-6 flex gap-2">
        <Link href="/dashboard">
          <Button>Open Dashboard</Button>
        </Link>
        <Link href="/">
          <Button variant="secondary">Back to LearnGuard</Button>
        </Link>
      </div>
    </div>
  );
}
