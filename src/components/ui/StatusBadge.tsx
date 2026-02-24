"use client";

import { STATUS_COLORS, STATUS_LABELS } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-[6px] px-2.5 py-1 text-[12px] font-semibold ${STATUS_COLORS[status] ?? "bg-[var(--color-gray-100)] text-[var(--color-gray-600)]"}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
