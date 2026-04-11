import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QRReview — Hệ thống đánh giá qua mã QR",
  description: "Thu thập đánh giá khách hàng qua mã QR thông minh",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
