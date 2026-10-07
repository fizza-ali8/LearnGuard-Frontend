import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { Toaster } from "sonner";
import { AppProviders } from "@/providers/app-providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LearnGuard",
    template: "%s · LearnGuard",
  },
  description:
    "LearnGuard helps educators identify early learning-risk indicators through multimodal screening and explainable insights.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-[15px] leading-6 text-body">
        <AppProviders>{children}</AppProviders>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              border: "1px solid #E8E8F0",
              borderRadius: "12px",
              color: "#20202A",
              fontSize: "14px",
              boxShadow: "0 4px 20px rgba(30, 30, 50, 0.04)",
            },
          }}
        />
      </body>
    </html>
  );
}
