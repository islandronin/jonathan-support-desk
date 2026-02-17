"use client";

import { useMutation, useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { api } from "../../../../../../convex/_generated/api";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { MessageThread } from "@/components/tickets/MessageThread";
import { AttachmentUpload } from "@/components/tickets/AttachmentUpload";
import { formatDate, STATUS_LABELS } from "@/lib/utils";
import type { Id } from "../../../../../../convex/_generated/dataModel";

type Attachment = {
  storageId: Id<"_storage">;
  fileName: string;
  contentType: string;
  size: number;
  previewUrl?: string;
};

const ALL_STATUSES = [
  "open",
  "in_progress",
  "awaiting_customer",
  "resolved",
  "closed",
] as const;

export default function AgentTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const ticketId = id as Id<"tickets">;

  const ticket = useQuery(api.tickets.getTicket, { ticketId });
  const messages = useQuery(api.tickets.getTicketMessages, { ticketId });
  const addMessage = useMutation(api.tickets.addMessage);
  const updateStatus = useMutation(api.tickets.updateTicketStatus);
  const assignTicket = useMutation(api.tickets.assignTicket);
  const unassignTicket = useMutation(api.tickets.unassignTicket);
  const currentUser = useQuery(api.users.currentUser);

  const [body, setBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [sending, setSending] = useState(false);

  if (
    ticket === undefined ||
    messages === undefined ||
    currentUser === undefined
  )
    return <LoadingSpinner />;

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    setSending(true);
    try {
      await addMessage({
        ticketId,
        body,
        isInternal,
        attachments:
          attachments.length > 0
            ? attachments.map(
                ({ storageId, fileName, contentType, size }) => ({
                  storageId,
                  fileName,
                  contentType,
                  size,
                })
              )
            : undefined,
      });
      setBody("");
      setAttachments([]);
      setIsInternal(false);
    } finally {
      setSending(false);
    }
  };

  const isAssignedToMe =
    ticket.assignedAgentId?.toString() === currentUser?._id.toString();

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">
              Ticket #{ticket.ticketNumber}
            </p>
            <h1 className="text-xl font-semibold text-gray-900">
              {ticket.subject}
            </h1>
          </div>
          <StatusBadge status={ticket.status} />
        </div>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
          <span>Customer: {ticket.customerName}</span>
          <span>Product: {ticket.productName}</span>
          <span>Created: {formatDate(ticket.createdAt)}</span>
          {ticket.assignedAgentName && (
            <span>Assigned: {ticket.assignedAgentName}</span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={ticket.status}
            onChange={(e) =>
              updateStatus({
                ticketId,
                status: e.target.value as any,
              })
            }
            className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          {isAssignedToMe ? (
            <button
              onClick={() => unassignTicket({ ticketId })}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Unassign from me
            </button>
          ) : (
            <button
              onClick={() => assignTicket({ ticketId })}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Assign to me
            </button>
          )}
        </div>
      </div>

      <MessageThread messages={messages as any} />

      <form onSubmit={handleReply} className="mt-6 space-y-3">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className={isInternal ? "text-amber-700 font-medium" : "text-gray-600"}>
              Internal note (not visible to customer)
            </span>
          </label>
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y ${
            isInternal
              ? "border-amber-300 bg-amber-50"
              : "border-gray-300"
          }`}
          placeholder={
            isInternal
              ? "Write an internal note..."
              : "Write your reply... (Markdown supported)"
          }
        />
        <AttachmentUpload
          attachments={attachments}
          onAttachmentsChange={setAttachments}
        />
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
            isInternal
              ? "bg-amber-600 text-white hover:bg-amber-700"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {sending
            ? "Sending..."
            : isInternal
              ? "Add Internal Note"
              : "Send Reply"}
        </button>
      </form>
    </div>
  );
}
