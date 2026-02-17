"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { api } from "../../../../../convex/_generated/api";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { timeAgo } from "@/lib/utils";

export default function AdminDashboard() {
  const stats = useQuery(api.admin.getDashboardStats);
  const recentTickets = useQuery(api.admin.listRecentTickets, { limit: 10 });

  if (stats === undefined || recentTickets === undefined)
    return <LoadingSpinner />;

  const statCards = [
    { label: "Total Tickets", value: stats.totalTickets, color: "text-gray-900" },
    { label: "Open", value: stats.open, color: "text-blue-600" },
    { label: "In Progress", value: stats.inProgress, color: "text-yellow-600" },
    { label: "Awaiting Customer", value: stats.awaitingCustomer, color: "text-orange-600" },
    { label: "Resolved", value: stats.resolved, color: "text-green-600" },
    { label: "Customers", value: stats.totalCustomers, color: "text-gray-900" },
    { label: "Agents", value: stats.totalAgents, color: "text-gray-900" },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-4">
        Admin Dashboard
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <p className="text-xs text-gray-500 mb-1">{card.label}</p>
            <p className={`text-2xl font-semibold ${card.color}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-medium text-gray-900 mb-3">
        Recent Tickets
      </h2>

      {recentTickets.length === 0 ? (
        <p className="text-sm text-gray-500">No tickets yet.</p>
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
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentTickets.map((ticket) => (
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
