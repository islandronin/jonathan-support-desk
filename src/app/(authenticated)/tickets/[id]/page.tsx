"use client";

import { useMutation, useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { api } from "../../../../../convex/_generated/api";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { MessageThread } from "@/components/tickets/MessageThread";
import { AttachmentUpload } from "@/components/tickets/AttachmentUpload";
import { formatDate, STATUS_LABELS } from "@/lib/utils";
import { Paperclip } from "lucide-react";
import Link from "next/link";
import type { Id } from "../../../../../convex/_generated/dataModel";

const PRODUCT_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  "Online Courses": { bg: "bg-[#eff6ff]", text: "text-[#3b82f6]" },
  "AI Agents": { bg: "bg-[#f0fdf4]", text: "text-[#22c55e]" },
  "Software Tools": { bg: "bg-[#fff7ed]", text: "text-[#f97316]" },
  "Origami Sites": { bg: "bg-[#fdf4ff]", text: "text-[#a855f7]" },
  "CyberStaffing": { bg: "bg-[#fef2f2]", text: "text-[#ef4444]" },
  "Membership Sites": { bg: "bg-[#ecfeff]", text: "text-[#06b6d4]" },
};

const STATUS_DOT_COLORS: Record<string, string> = {
  open: "bg-[#3b82f6]",
  in_progress: "bg-[#f59e0b]",
  awaiting_customer: "bg-[#f97316]",
  resolved: "bg-[#22c55e]",
  closed: "bg-[#6b7280]",
};

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
  const prodColor = PRODUCT_BADGE_COLORS[ticket.productName] ?? {
    bg: "bg-[var(--color-gray-100)]",
    text: "text-[var(--color-gray-600)]",
  };

  return (
    <div className="flex flex-col gap-6 px-20 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px]">
        <Link href="/dashboard" className="font-medium text-[var(--color-blue)] hover:underline">
          My Tickets
        </Link>
        <span className="text-[var(--color-gray-500)]">&gt;</span>
        <span className="font-medium text-[var(--color-gray-500)]">
          Ticket #{String(ticket.ticketNumber).padStart(4, "0")}
        </span>
      </div>

      {/* Main content + sidebar */}
      <div className="flex gap-8">
        {/* Main Column */}
        <div className="flex flex-1 flex-col gap-6">
          {/* Ticket Header Card */}
          <div className="flex flex-col gap-3 rounded-[16px] border-[1.5px] border-[var(--color-gray-200)] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <h1 className="text-[22px] font-bold tracking-[-0.3px] text-[var(--color-navy)]">
              {ticket.subject}
            </h1>
            <div className="flex items-center gap-2.5">
              <span className={`rounded-[6px] px-2.5 py-1 text-[12px] font-medium ${prodColor.bg} ${prodColor.text}`}>
                {ticket.productName}
              </span>
              <StatusBadge status={ticket.status} />
              <span className="text-[13px] text-[#a1a1aa]">
                Created: {formatDate(ticket.createdAt)}
              </span>
            </div>
          </div>

          {/* Conversation Thread */}
          <MessageThread messages={messages as any} />

          {/* Reply Box */}
          {!isClosed && (
            <form
              onSubmit={handleReply}
              className="flex items-end gap-3 rounded-[12px] border-[1.5px] border-[var(--color-gray-200)] bg-white p-4"
            >
              <button
                type="button"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[var(--color-gray-50)] text-[var(--color-gray-500)] hover:bg-[var(--color-gray-200)] transition-colors"
                title="Attach file"
              >
                <Paperclip className="h-[18px] w-[18px]" />
              </button>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                className="flex-1 rounded-[8px] bg-[var(--color-gray-50)] p-3 text-[14px] text-[var(--color-navy)] placeholder:text-[#a1a1aa] outline-none resize-none"
                placeholder="Write a reply..."
              />
              <button
                type="submit"
                disabled={sending || !body.trim()}
                className="flex h-10 items-center justify-center rounded-[10px] bg-[var(--color-blue)] px-5 text-[14px] font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
              >
                {sending ? "Sending..." : "Send Reply"}
              </button>
            </form>
          )}

          {/* Attachments (hidden, managed through paperclip) */}
          {attachments.length > 0 && (
            <div className="px-4">
              <AttachmentUpload
                attachments={attachments}
                onAttachmentsChange={setAttachments}
              />
            </div>
          )}
        </div>

        {/* Ticket Info Sidebar */}
        <div className="w-[280px] shrink-0 rounded-[16px] bg-[var(--color-gray-50)] p-6">
          <h3 className="mb-5 text-[16px] font-bold text-[var(--color-navy)]">Ticket Info</h3>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-medium text-[#a1a1aa]">Status</span>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${STATUS_DOT_COLORS[ticket.status] ?? "bg-gray-400"}`} />
                <span className="text-[14px] font-semibold text-[var(--color-navy)]">
                  {STATUS_LABELS[ticket.status] ?? ticket.status}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-medium text-[#a1a1aa]">Product</span>
              <span className="text-[14px] font-medium text-[var(--color-navy)]">
                {ticket.productName}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-medium text-[#a1a1aa]">Created</span>
              <span className="text-[14px] font-medium text-[var(--color-navy)]">
                {formatDate(ticket.createdAt)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-medium text-[#a1a1aa]">Last Updated</span>
              <span className="text-[14px] font-medium text-[var(--color-navy)]">
                {formatDate(ticket.updatedAt)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-medium text-[#a1a1aa]">Ticket #</span>
              <span className="text-[14px] font-medium text-[var(--color-navy)]">
                {String(ticket.ticketNumber).padStart(4, "0")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
