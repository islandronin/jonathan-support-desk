"use client";

import { Navbar } from "@/components/layout/Navbar";
import { RoleRedirect } from "@/components/layout/RoleRedirect";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleRedirect>
      <Navbar />
      <main>{children}</main>
    </RoleRedirect>
  );
}
