import type { Metadata } from "next";
import { ExportToolbarProvider } from "@/components/ExportToolbar";
import { Nav } from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Match Factory 研究视图",
  description: "本地包体策划数据可视化",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen font-sans antialiased">
        <Nav />
        <ExportToolbarProvider>
          <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 sm:pt-8">{children}</main>
        </ExportToolbarProvider>
      </body>
    </html>
  );
}
