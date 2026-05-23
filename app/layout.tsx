import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "방구조대 — 방 정리 순서 AI",
  description: "방 사진 찍으면 AI가 지금 당장 할 정리 순서를 알려줘요.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
