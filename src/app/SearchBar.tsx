"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = query.trim();
    if (subject) {
      router.push(`/tickets/new?subject=${encodeURIComponent(subject)}`);
    } else {
      router.push("/tickets/new");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-[56px] w-full max-w-[640px] items-center gap-3 rounded-[16px] border-[1.5px] border-[var(--color-gray-200)] bg-white px-5 shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
    >
      <Search className="h-5 w-5 shrink-0 text-[#a1a1aa]" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Describe your issue and hit Enter to submit a ticket..."
        className="w-full bg-transparent text-[15px] text-[var(--color-navy)] placeholder:text-[#a1a1aa] outline-none"
      />
    </form>
  );
}
