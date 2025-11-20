import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ToastContainer";
import PopupInjector from '@/components/PopupInjector';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CMS Tool",
  description: "Manage your collections and content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>
          {children}
          <PopupInjector />
        </ToastProvider>
      </body>
    </html>
  );
}