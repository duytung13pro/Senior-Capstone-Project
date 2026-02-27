import type React from "react";
import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthSessionProvider } from "@/components/auth-session-provider";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Project Rewood - Learn Chinese Effectively",
  description:
    "Learn Chinese effectively anytime, anywhere with Project Rewood.",
  generator: "Project Rewood team",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthSessionProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            {children}
            <Toaster />
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
