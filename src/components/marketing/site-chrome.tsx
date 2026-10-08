import { Logo, ScreeningDisclaimer } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const links = [
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#modules", label: "Screening Modules" },
  { href: "/#explainability", label: "Explainability" },
  { href: "/#research", label: "Research" },
  { href: "/#privacy", label: "Privacy" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-white/95">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-4 px-5 md:px-8">
        <Logo href="/" />
        <nav className="ml-auto hidden items-center gap-5 lg:flex" aria-label="Public">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-body hover:text-heading">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 lg:ml-4">
          <Link href="/login">
            <Button variant="secondary" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="sm">Open Dashboard</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-5 py-10 md:flex-row md:items-start md:justify-between md:px-8">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
            AI-assisted educational screening support. Not a clinical diagnostic system.
          </p>
          <p className="mt-2 text-xs text-faint">Final Year Project · FAST-NUCES · 2026</p>
        </div>
        <div className="flex gap-5 text-sm text-body">
          <Link href="/#privacy" className="hover:text-heading">Privacy</Link>
          <Link href="/about" className="hover:text-heading">About</Link>
          <Link href="/help" className="hover:text-heading">Help</Link>
        </div>
      </div>
      <div className="border-t border-line">
        <ScreeningDisclaimer className="mx-auto max-w-[1200px] px-5 py-4 md:px-8" />
      </div>
    </footer>
  );
}
