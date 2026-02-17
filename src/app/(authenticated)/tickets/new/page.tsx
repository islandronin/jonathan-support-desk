"use client";

import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../../../../../convex/_generated/api";
import { AttachmentUpload } from "@/components/tickets/AttachmentUpload";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { Id } from "../../../../../convex/_generated/dataModel";

type Attachment = {
  storageId: Id<"_storage">;
  fileName: string;
  contentType: string;
  size: number;
  previewUrl?: string;
};

export default function NewTicketPage() {
  const products = useQuery(api.tickets.listProducts);
  const createTicket = useMutation(api.tickets.createTicket);
  const router = useRouter();

  const [productId, setProductId] = useState("");
  const [subject, setSubject] = useState("");
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
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">
        Submit a Ticket
      </h1>

      {products.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          No products are available yet. Please check back later.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product
            </label>
            <select
              required
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a product...</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description of your issue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              placeholder="Describe your issue in detail. Markdown is supported."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attachments
            </label>
            <AttachmentUpload
              attachments={attachments}
              onAttachmentsChange={setAttachments}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Submitting..." : "Submit Ticket"}
          </button>
        </form>
      )}
    </div>
  );
}
