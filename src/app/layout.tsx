import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Providers } from "@/components/Providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Claude Code IDE",
  description: "A modern IDE with Claude AI integration and GitHub repository management",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="w-screen h-screen">
      <body className={`${inter.variable} font-sans antialiased w-screen h-screen`}>
        <ErrorBoundary>
          <Providers>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
