"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageTracker } from "@/components/PageTracker";

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname.startsWith("/login");
  
  return (
    <>
      <PageTracker />
      {!isLoginPage && <Header />}
      {children}
      {!isLoginPage && <Footer />}
    </>
  );
}
