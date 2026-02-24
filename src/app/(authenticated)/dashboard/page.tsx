"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { timeAgo } from "@/lib/utils";
import { Plus } from "lucide-react";

const PRODUCT_COLORS: Record<string, { bg: string; text: string }> = {
  "Online Courses": { bg: "bg-[#eff6ff]", text: "text-[#3b82f6]" },
  "AI Agents": { bg: "bg-[#f0fdf4]", text: "text-[#22c55e]" },
  "Software Tools": { bg: "bg-[#fff7ed]", text: "text-[#f97316]" },
  "Origami Sites": { bg: "bg-[#fdf4ff]", text: "text-[#a855f7]" },
  "CyberStaffing": { bg: "bg-[#fef2f2]", text: "text-[#ef4444]" },
  "Membership Sites": { bg: "bg-[#ecfeff]", text: "text-[#06b6d4]" },
};

type FilterTab = "all" | "open" | "awaiting_customer" | "resolved";

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "awaiting_customer", label: "Awaiting Response" },
  { key: "resolved", label: "Resolved" },
];

export default function CustomerDashboard() {
  const tickets = useQuery(api.tickets.listCustomerTickets);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  if (tickets === undefined) return <LoadingSpinner />;

  const filtered =
    activeTab === "all"
      ? tickets
      : tickets.filter((t) => t.status === activeTab);

  return (
    <div className="flex flex-col gap-6 px-20 py-10">
      {/* Title Row */}
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] font-bold tracking-[-0.5px] text-[var(--color-navy)]">
          My Tickets
        </h1>
        <Link
          href="/tickets/new"
          className="flex items-center gap-2 rounded-[10px] bg-[var(--color-blue)] px-5 py-2.5 text-[14px] font-semibold text-white hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          New Ticket
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex w-full border-b border-[var(--color-gray-200)]">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-[14px] font-medium transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-[var(--color-blue)] text-[var(--color-blue)] font-semibold"
                : "text-[var(--color-gray-500)] hover:text-[var(--color-navy)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Ticket List */}
      {tickets.length === 0 ? (
        <EmptyState
          title="No tickets yet"
          description="Submit a support ticket and we'll get back to you."
          action={
            <Link
              href="/tickets/new"
              className="inline-flex items-center gap-2 rounded-[10px] bg-[var(--color-blue)] px-5 py-2.5 text-[14px] font-semibold text-white hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              Submit a Ticket
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-[14px] text-[var(--color-gray-500)]">
          No tickets matching this filter.
        </p>
      ) : (
        <div className="flex flex-col">
          {filtered.map((ticket) => {
            const prodColor = PRODUCT_COLORS[ticket.productName] ?? {
              bg: "bg-[var(--color-gray-100)]",
              text: "text-[var(--color-gray-600)]",
            };
            return (
              <Link
                key={ticket._id}
                href={`/tickets/${ticket._id}`}
                className="flex items-center justify-between border-b border-[var(--color-gray-200)] px-5 py-4 hover:bg-[var(--color-gray-50)] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[13px] font-medium text-[#a1a1aa]">
                    #{String(ticket.ticketNumber).padStart(4, "0")}
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[15px] font-semibold text-[var(--color-navy)]">
                      {ticket.subject}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-[6px] px-2.5 py-1 text-[12px] font-medium ${prodColor.bg} ${prodColor.text}`}
                      >
                        {ticket.productName}
                      </span>
                      <StatusBadge status={ticket.status} />
                    </div>
                  </div>
                </div>
                <span className="text-[13px] text-[#a1a1aa]">
                  {timeAgo(ticket.updatedAt)}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination info */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-[13px] text-[#a1a1aa]">
            Showing 1-{filtered.length} of {filtered.length} tickets
          </span>
        </div>
      )}
    </div>
  );
}
