import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HRMSTech – Simplify HR, Empower Your Team",
  description:
    "Modern HRMS to manage employees, payroll, attendance, performance, and compliance in one place.",
  metadataBase: new URL("https://hrmstech.example.com"),
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "HRMSTech – Simplify HR, Empower Your Team",
    description:
      "All-in-one HR software for employee management, payroll, attendance, performance and analytics.",
    url: "/",
    siteName: "HRMSTech",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HRMSTech – Simplify HR, Empower Your Team",
    description:
      "All-in-one HR software for employee management, payroll, attendance, performance and analytics.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
