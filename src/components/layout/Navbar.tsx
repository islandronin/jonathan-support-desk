"use client";

import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { LogOut, ChevronDown } from "lucide-react";

export function Navbar() {
  const user = useQuery(api.users.currentUser);
  const { signOut } = useAuthActions();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const isAgent = user.role === "agent";
  const isAdmin = user.role === "admin";
  const displayName = user.name || user.email || "User";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <header className="flex h-[72px] w-full items-center justify-between border-b border-[var(--color-gray-200)] bg-white px-20">
      <div className="flex items-center gap-8">
        <Link
          href={isAdmin ? "/admin/dashboard" : isAgent ? "/agent/dashboard" : "/dashboard"}
          className="text-[22px] font-bold tracking-[-0.5px] text-[var(--color-navy)]"
        >
          JonathanSupport
        </Link>
        {!isAgent && !isAdmin && (
          <>
            <Link
              href="/dashboard"
              className="text-[14px] font-medium text-[var(--color-gray-500)] hover:text-[var(--color-navy)] transition-colors"
            >
              My Tickets
            </Link>
            <Link
              href="/tickets/new"
              className="text-[14px] font-medium text-[var(--color-gray-500)] hover:text-[var(--color-navy)] transition-colors"
            >
              New Ticket
            </Link>
          </>
        )}
        {isAgent && (
          <Link
            href="/agent/dashboard"
            className="text-[14px] font-medium text-[var(--color-gray-500)] hover:text-[var(--color-navy)] transition-colors"
          >
            Ticket Queue
          </Link>
        )}
        {isAdmin && (
          <>
            <Link
              href="/admin/dashboard"
              className="text-[14px] font-medium text-[var(--color-gray-500)] hover:text-[var(--color-navy)] transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/products"
              className="text-[14px] font-medium text-[var(--color-gray-500)] hover:text-[var(--color-navy)] transition-colors"
            >
              Products
            </Link>
            <Link
              href="/admin/agents"
              className="text-[14px] font-medium text-[var(--color-gray-500)] hover:text-[var(--color-navy)] transition-colors"
            >
              Agents
            </Link>
          </>
        )}
      </div>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-blue)] text-white text-[14px] font-semibold">
            {initials}
          </div>
          <span className="text-[14px] font-medium text-[var(--color-gray-500)]">
            {displayName}
          </span>
          <ChevronDown className="h-4 w-4 text-[var(--color-gray-500)]" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 rounded-[12px] border border-[var(--color-gray-200)] bg-white py-2 shadow-[0_4px_16px_rgba(0,0,0,0.08)] z-50">
            <div className="px-4 py-2 border-b border-[var(--color-gray-200)]">
              <p className="text-[13px] font-medium text-[var(--color-navy)]">{displayName}</p>
              {user.email && (
                <p className="text-[12px] text-[var(--color-gray-500)] truncate">{user.email}</p>
              )}
              {(isAgent || isAdmin) && (
                <span className="mt-1 inline-block rounded-[4px] bg-[var(--color-gray-100)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-gray-600)]">
                  {user.role}
                </span>
              )}
            </div>
            <button
              onClick={() => void signOut()}
              className="flex w-full items-center gap-2 px-4 py-2 text-[13px] text-[var(--color-gray-500)] hover:bg-[var(--color-gray-50)] transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
