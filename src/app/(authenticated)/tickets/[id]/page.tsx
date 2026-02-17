"use client";

import { useMutation, useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { api } from "../../../../../convex/_generated/api";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { MessageThread } from "@/components/tickets/MessageThread";
import { AttachmentUpload } from "@/components/tickets/AttachmentUpload";
import { formatDate } from "@/lib/utils";
import type { Id } from "../../../../../convex/_generated/dataModel";

type Attachment = {
  storageId: Id<"_storage">;
  fileName: string;
  contentType: string;
  size: number;
  previewUrl?: string;
};

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const ticketId = id as Id<"tickets">;

  const ticket = useQuery(api.tickets.getTicket, { ticketId });
  const messages = useQuery(api.tickets.getTicketMessages, { ticketId });
  const addMessage = useMutation(api.tickets.addMessage);

  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [sending, setSending] = useState(false);

  if (ticket === undefined || messages === undefined) return <LoadingSpinner />;

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    setSending(true);
    try {
      await addMessage({
        ticketId,
        body,
        attachments: attachments.length > 0
          ? attachments.map(({ storageId, fileName, contentType, size }) => ({
              storageId,
              fileName,
              contentType,
              size,
            }))
          : undefined,
      });
      setBody("");
      setAttachments([]);
    } finally {
      setSending(false);
    }
  };

  const isClosed = ticket.status === "closed" || ticket.status === "resolved";

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
        <div className="mt-2 flex gap-4 text-sm text-gray-500">
          <span>Product: {ticket.productName}</span>
          <span>Created: {formatDate(ticket.createdAt)}</span>
        </div>
      </div>

      <MessageThread messages={messages as any} />

      {!isClosed && (
        <form onSubmit={handleReply} className="mt-6 space-y-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            placeholder="Write your reply... (Markdown supported)"
          />
          <AttachmentUpload
            attachments={attachments}
            onAttachmentsChange={setAttachments}
          />
          <button
            type="submit"
            disabled={sending || !body.trim()}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {sending ? "Sending..." : "Send Reply"}
          </button>
        </form>
      )}
    </div>
  );
}
