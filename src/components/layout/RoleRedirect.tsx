"use client";

import { useQuery } from "convex/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "../../../convex/_generated/api";

export function RoleRedirect({ children }: { children: React.ReactNode }) {
  const user = useQuery(api.users.currentUser);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) return;

    const isAgent = user.role === "agent";
    const isAdmin = user.role === "admin";

    // Redirect agents away from customer pages
    if (isAgent && !pathname.startsWith("/agent")) {
      router.replace("/agent/dashboard");
      return;
    }

    // Redirect admins away from customer pages (but allow /agent routes for ticket management)
    if (isAdmin && !pathname.startsWith("/admin") && !pathname.startsWith("/agent")) {
      router.replace("/admin/dashboard");
      return;
    }

    // Redirect customers away from agent/admin pages
    if (!isAgent && !isAdmin) {
      if (pathname.startsWith("/agent") || pathname.startsWith("/admin")) {
        router.replace("/dashboard");
        return;
      }
    }
  }, [user, pathname, router]);

  if (user === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  return <>{children}</>;
}
