"use client";

import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function Navbar() {
  const user = useQuery(api.users.currentUser);
  const { signOut } = useAuthActions();

  if (!user) return null;

  const isAgent = user.role === "agent";
  const isAdmin = user.role === "admin";

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          <div className="flex items-center gap-6">
            <Link
              href={isAdmin ? "/admin/dashboard" : isAgent ? "/agent/dashboard" : "/dashboard"}
              className="text-lg font-semibold text-gray-900"
            >
              JonathanSupport
            </Link>
            {!isAgent && !isAdmin && (
              <>
                <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                  My Tickets
                </Link>
                <Link href="/tickets/new" className="text-sm text-gray-600 hover:text-gray-900">
                  New Ticket
                </Link>
              </>
            )}
            {isAgent && (
              <Link href="/agent/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                Ticket Queue
              </Link>
            )}
            {isAdmin && (
              <>
                <Link href="/admin/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                  Dashboard
                </Link>
                <Link href="/admin/products" className="text-sm text-gray-600 hover:text-gray-900">
                  Products
                </Link>
                <Link href="/admin/agents" className="text-sm text-gray-600 hover:text-gray-900">
                  Agents
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {user.name || user.email}
              {(isAgent || isAdmin) && (
                <span className="ml-1.5 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                  {user.role}
                </span>
              )}
            </span>
            <button
              onClick={() => void signOut()}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
