"use client";

import { useMutation, useQuery } from "convex/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { api } from "../../../../../convex/_generated/api";
import { AttachmentUpload } from "@/components/tickets/AttachmentUpload";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { CircleCheck, ChevronDown, Upload } from "lucide-react";
import Link from "next/link";
import type { Id } from "../../../../../convex/_generated/dataModel";

type Attachment = {
  storageId: Id<"_storage">;
  fileName: string;
  contentType: string;
  size: number;
  previewUrl?: string;
};

const tips = [
  "Use a clear subject line",
  "Include screenshots if possible",
  "Mention your browser and device",
  "Describe steps to reproduce the issue",
];

export default function NewTicketPage() {
  const products = useQuery(api.tickets.listProducts);
  const createTicket = useMutation(api.tickets.createTicket);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [productId, setProductId] = useState("");
  const [subject, setSubject] = useState(searchParams.get("subject") ?? "");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (products === undefined) return <LoadingSpinner />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!productId) {
      setError("Please select a product.");
      return;
    }

    setLoading(true);
    try {
      const ticketId = await createTicket({
        subject,
        productId: productId as Id<"products">,
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
      router.push(`/tickets/${ticketId}`);
    } catch {
      setError("Failed to create ticket. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 px-20 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px]">
        <Link href="/dashboard" className="font-medium text-[var(--color-blue)] hover:underline">
          Home
        </Link>
        <span className="text-[var(--color-gray-500)]">&gt;</span>
        <span className="font-medium text-[var(--color-gray-500)]">Submit a Ticket</span>
      </div>

      {/* Page Title */}
      <h1 className="text-[28px] font-bold tracking-[-0.5px] text-[var(--color-navy)]">
        Submit a New Ticket
      </h1>

      {/* Content: Form + Sidebar */}
      <div className="flex gap-8">
        {/* Form Column */}
        <div className="flex-1">
          {products.length === 0 ? (
            <div className="rounded-[16px] border-[1.5px] border-yellow-200 bg-yellow-50 p-8 text-[14px] text-yellow-800">
              No products are available yet. Please check back later.
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-6 rounded-[16px] border-[1.5px] border-[var(--color-gray-200)] bg-white p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
            >
              {/* Product Select */}
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-semibold text-[var(--color-navy)]">
                  Which product do you need help with? *
                </label>
                <div className="relative">
                  <select
                    required
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="h-12 w-full appearance-none rounded-[12px] border-[1.5px] border-[var(--color-gray-200)] bg-white px-4 pr-10 text-[15px] text-[var(--color-navy)] outline-none focus:border-[var(--color-blue)] focus:ring-2 focus:ring-[var(--color-blue)]/20 transition-colors"
                  >
                    <option value="">Select a product...</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-gray-500)]" />
                </div>
              </div>

              {/* Subject */}
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-semibold text-[var(--color-navy)]">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="h-12 w-full rounded-[12px] border-[1.5px] border-[var(--color-gray-200)] bg-white px-4 text-[15px] text-[var(--color-navy)] placeholder:text-[#a1a1aa] outline-none focus:border-[var(--color-blue)] focus:ring-2 focus:ring-[var(--color-blue)]/20 transition-colors"
                  placeholder="Brief description of your issue"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-semibold text-[var(--color-navy)]">
                  Describe your issue in detail *
                </label>
                <textarea
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={7}
                  className="w-full rounded-[12px] border-[1.5px] border-[var(--color-gray-200)] bg-white p-4 text-[15px] text-[var(--color-navy)] placeholder:text-[#a1a1aa] outline-none focus:border-[var(--color-blue)] focus:ring-2 focus:ring-[var(--color-blue)]/20 transition-colors resize-y"
                  placeholder="Include steps to reproduce, error messages, screenshots, etc."
                />
              </div>

              {/* Attachments */}
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-semibold text-[var(--color-navy)]">
                  Attachments
                </label>
                <AttachmentUpload
                  attachments={attachments}
                  onAttachmentsChange={setAttachments}
                />
              </div>

              {error && (
                <p className="text-[14px] text-red-500">{error}</p>
              )}

              {/* Buttons */}
              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-12 w-full items-center justify-center rounded-[12px] bg-[var(--color-blue)] text-[15px] font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {loading ? "Submitting..." : "Submit Ticket"}
                </button>
                <Link
                  href="/dashboard"
                  className="text-[15px] font-medium text-[var(--color-gray-500)] hover:text-[var(--color-navy)] transition-colors whitespace-nowrap"
                >
                  Cancel
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Tips Sidebar */}
        <div className="w-80 shrink-0 rounded-[16px] bg-[var(--color-gray-50)] p-6">
          <h3 className="mb-4 text-[16px] font-bold text-[var(--color-navy)]">
            Tips for faster support
          </h3>
          <div className="flex flex-col gap-4">
            {tips.map((tip) => (
              <div key={tip} className="flex items-center gap-2.5">
                <CircleCheck className="h-[18px] w-[18px] shrink-0 text-[#22c55e]" />
                <span className="text-[14px] text-[var(--color-gray-600)]">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
