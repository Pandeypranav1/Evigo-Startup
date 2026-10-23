import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Client Dashboard",
  description:
    "Track and manage your event bookings on Evigo. View booking status, accepted/rejected requests, and more.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
