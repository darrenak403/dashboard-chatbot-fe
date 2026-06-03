import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "FPT Admission — Quản trị",
    template: "%s | FPT Admission",
  },
  description:
    "Bảng điều khiển quản trị tuyển sinh FPT — khoa, chương trình, cơ sở, học phí",
  icons: {
    icon: [{ url: "/Logo-FPT-1024x620.webp", type: "image/webp" }],
    apple: "/Logo-FPT-1024x620.webp",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" richColors closeButton duration={4000} />
      </body>
    </html>
  );
}
