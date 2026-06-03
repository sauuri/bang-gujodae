import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LangProvider } from "./utils/LangContext";
// import { PremiumProvider } from "./utils/PremiumContext"; // 유료화 중단 (2026-06-04)

export const metadata: Metadata = {
  title: "방구조대 — 방 정리 순서 AI",
  description: "방 사진 찍으면 AI가 지금 당장 할 정리 순서를 알려줘요.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body style={{ background: "#F2FBEA" }}>
        {/* <PremiumProvider> */}
          <LangProvider>{children}</LangProvider>
        {/* </PremiumProvider> */}
      </body>
    </html>
  );
}
