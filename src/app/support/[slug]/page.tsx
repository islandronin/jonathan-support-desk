"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { GuestTicketForm } from "@/components/tickets/GuestTicketForm";

export default function SupportProductPage() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <div className="flex min-h-full flex-col bg-[var(--color-white)]">
      {/* Header */}
      <header className="flex h-[72px] w-full items-center justify-between border-b border-[var(--color-gray-200)] bg-white px-20">
        <Link
          href="/"
          className="text-[22px] font-bold tracking-[-0.5px] text-[var(--color-navy)]"
        >
          JonathanSupport
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/login"
            className="text-[15px] font-medium text-[var(--color-gray-500)] hover:text-[var(--color-navy)] transition-colors"
          >
            Log In
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex flex-col gap-6 px-20 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[13px]">
          <Link
            href="/"
            className="font-medium text-[var(--color-blue)] hover:underline"
          >
            Home
          </Link>
          <span className="text-[var(--color-gray-500)]">&gt;</span>
          <span className="font-medium text-[var(--color-gray-500)]">
            Submit a Ticket
          </span>
        </div>

        {/* Page Title */}
        <h1 className="text-[28px] font-bold tracking-[-0.5px] text-[var(--color-navy)]">
          Submit a New Ticket
        </h1>

        <GuestTicketForm slug={slug} />
      </div>
    </div>
  );
}
