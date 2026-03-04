import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dongy Clinic SaaS",
  description: "Hệ thống quản lý phòng khám Đông y multi-tenant"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
