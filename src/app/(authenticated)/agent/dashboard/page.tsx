"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { api } from "../../../../../convex/_generated/api";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { timeAgo } from "@/lib/utils";

const STATUSES = [
  { value: undefined, label: "All" },
  { value: "open" as const, label: "Open" },
  { value: "in_progress" as const, label: "In Progress" },
  { value: "awaiting_customer" as const, label: "Awaiting Customer" },
  { value: "resolved" as const, label: "Resolved" },
  { value: "closed" as const, label: "Closed" },
];

export default function AgentDashboard() {
  const [statusFilter, setStatusFilter] = useState<
    "open" | "in_progress" | "awaiting_customer" | "resolved" | "closed" | undefined
  >(undefined);

  const tickets = useQuery(api.tickets.listAgentTickets, { statusFilter });

  if (tickets === undefined) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-4">
        Ticket Queue
      </h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s.label}
            onClick={() => setStatusFilter(s.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s.value
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {tickets.length === 0 ? (
        <EmptyState
          title="No tickets"
          description="No tickets match the current filter."
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Subject
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Assigned
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tickets.map((ticket) => (
                <tr key={ticket._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {ticket.ticketNumber}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/agent/tickets/${ticket._id}`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      {ticket.subject}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {ticket.customerName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {ticket.productName}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {ticket.assignedAgentName ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {timeAgo(ticket.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
