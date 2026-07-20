import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Character Story Studio",
  description: "AI 캐릭터와의 대화를 개인화 모션코믹 영상으로 만드는 파이프라인 데모",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-[#0b0f1a] text-[#f5f5f7] antialiased">{children}</body>
    </html>
  );
}
