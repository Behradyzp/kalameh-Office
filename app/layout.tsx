import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "دفتر کلمه",
  description: "سامانه مدیریت پروژه، وظایف، تیم و امور مالی آژانس تبلیغاتی کلمه",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className="antialiased">{children}</body>
    </html>
  );
}
