"use client";

import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { api } from "../../../convex/_generated/api";
import { AttachmentUpload } from "./AttachmentUpload";
import { CircleCheck, ChevronDown, Loader2 } from "lucide-react";
import Link from "next/link";
import type { Id } from "../../../convex/_generated/dataModel";

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

export function GuestTicketForm({ slug }: { slug?: string }) {
  const products = useQuery(api.tickets.listProducts);
  const productBySlug = useQuery(
    api.tickets.getProductBySlug,
    slug ? { slug } : "skip"
  );
  const createTicket = useMutation(api.tickets.createTicket);
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<"form" | "auth">("form");
  const [productId, setProductId] = useState("");
  const [subject, setSubject] = useState(searchParams.get("subject") ?? "");
  const [body, setBody] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Pre-select product when slug resolves
  useEffect(() => {
    if (productBySlug && !productId) {
      setProductId(productBySlug._id);
    }
  }, [productBySlug, productId]);

  // If user becomes authenticated (from auth step), submit the ticket
  const [pendingSubmit, setPendingSubmit] = useState(false);
  useEffect(() => {
    if (pendingSubmit && isAuthenticated) {
      submitTicket();
      setPendingSubmit(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSubmit, isAuthenticated]);

  if (products === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-blue)]" />
      </div>
    );
  }

  const submitTicket = async () => {
    setLoading(true);
    setError("");
    try {
      const ticketId = await createTicket({
        subject,
        productId: productId as Id<"products">,
        body,
        attachments:
          attachments.length > 0
            ? attachments.map(({ storageId, fileName, contentType, size }) => ({
                storageId,
                fileName,
                contentType,
                size,
              }))
            : undefined,
      });
      router.push(`/tickets/${ticketId}`);
    } catch (err: any) {
      setError(err?.message ?? "Failed to create ticket. Please try again.");
      setLoading(false);
    }
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!productId) {
      setError("Please select a product.");
      return;
    }
    if (!subject.trim()) {
      setError("Please enter a subject.");
      return;
    }
    if (!body.trim()) {
      setError("Please describe your issue.");
      return;
    }

    // If already logged in, submit directly
    if (isAuthenticated) {
      submitTicket();
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setStep("auth");
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      // Try sign up first (new user)
      await signIn("password", {
        email: email.toLowerCase(),
        password,
        flow: "signUp",
      });
      setPendingSubmit(true);
    } catch {
      // Account may already exist, try sign in
      try {
        await signIn("password", {
          email: email.toLowerCase(),
          password,
          flow: "signIn",
        });
        setPendingSubmit(true);
      } catch {
        setError("Incorrect password. Please try again.");
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex gap-8">
      {/* Form Column */}
      <div className="flex-1">
        {products.length === 0 ? (
          <div className="rounded-[16px] border-[1.5px] border-yellow-200 bg-yellow-50 p-8 text-[14px] text-yellow-800">
            No products are available yet. Please check back later.
          </div>
        ) : step === "form" ? (
          <form
            onSubmit={handleContinue}
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

            {/* Email — only show if not logged in */}
            {!isAuthenticated && (
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-semibold text-[var(--color-navy)]">
                  Your email address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 w-full rounded-[12px] border-[1.5px] border-[var(--color-gray-200)] bg-white px-4 text-[15px] text-[var(--color-navy)] placeholder:text-[#a1a1aa] outline-none focus:border-[var(--color-blue)] focus:ring-2 focus:ring-[var(--color-blue)]/20 transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            )}

            {error && <p className="text-[14px] text-red-500">{error}</p>}

            {/* Submit / Continue */}
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center rounded-[12px] bg-[var(--color-blue)] text-[15px] font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isAuthenticated ? (
                  "Submit Ticket"
                ) : (
                  "Continue"
                )}
              </button>
              <Link
                href="/"
                className="text-[15px] font-medium text-[var(--color-gray-500)] hover:text-[var(--color-navy)] transition-colors whitespace-nowrap"
              >
                Cancel
              </Link>
            </div>
          </form>
        ) : (
          /* Auth Step */
          <form
            onSubmit={handleAuthSubmit}
            className="flex flex-col gap-6 rounded-[16px] border-[1.5px] border-[var(--color-gray-200)] bg-white p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
          >
            <div>
              <h2 className="text-[20px] font-bold text-[var(--color-navy)]">
                Almost there!
              </h2>
              <p className="mt-1 text-[14px] text-[var(--color-gray-500)]">
                Create a password to set up your account, or enter your existing
                password to sign in.
              </p>
            </div>

            {/* Email display */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-semibold text-[var(--color-navy)]">
                Email
              </label>
              <div className="flex h-12 items-center rounded-[12px] border-[1.5px] border-[var(--color-gray-200)] bg-[var(--color-gray-50)] px-4 text-[15px] text-[var(--color-gray-500)]">
                {email}
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-semibold text-[var(--color-navy)]">
                Password *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                className="h-12 w-full rounded-[12px] border-[1.5px] border-[var(--color-gray-200)] bg-white px-4 text-[15px] text-[var(--color-navy)] placeholder:text-[#a1a1aa] outline-none focus:border-[var(--color-blue)] focus:ring-2 focus:ring-[var(--color-blue)]/20 transition-colors"
                placeholder="Minimum 8 characters"
                autoFocus
              />
              <p className="text-[12px] text-[var(--color-gray-500)]">
                New here? This will create your account. Already registered?
                Enter your existing password.
              </p>
            </div>

            {error && <p className="text-[14px] text-red-500">{error}</p>}

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center rounded-[12px] bg-[var(--color-blue)] text-[15px] font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Submit Ticket"
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("form");
                  setError("");
                }}
                className="text-[15px] font-medium text-[var(--color-gray-500)] hover:text-[var(--color-navy)] transition-colors whitespace-nowrap"
              >
                Back
              </button>
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
              <span className="text-[14px] text-[var(--color-gray-600)]">
                {tip}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
