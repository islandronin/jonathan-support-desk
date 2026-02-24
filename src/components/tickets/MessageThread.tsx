"use client";

import { MarkdownBody } from "./MarkdownBody";
import { formatDate } from "@/lib/utils";
import { Image as ImageIcon, FileText } from "lucide-react";

type Message = {
  _id: string;
  body: string;
  isInternal: boolean;
  authorName: string;
  authorRole: string;
  createdAt: number;
  attachmentsWithUrls: {
    fileName: string;
    contentType: string;
    url: string | null;
  }[];
};

export function MessageThread({ messages }: { messages: Message[] }) {
  return (
    <div className="flex flex-col gap-4">
      {messages.map((msg) => {
        const isCustomer = msg.authorRole === "customer";
        const isStaff = !isCustomer && !msg.isInternal;
        const initials = msg.authorName.charAt(0).toUpperCase();

        return (
          <div
            key={msg._id}
            className={`flex gap-3 rounded-[12px] p-5 ${
              msg.isInternal
                ? "bg-amber-50 border-l-[3px] border-l-amber-400"
                : isCustomer
                  ? "bg-[#f8f9fa]"
                  : "bg-white border-l-[3px] border-l-[#3b82f6]"
            }`}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-white ${
                isCustomer ? "bg-[#3b82f6]" : "bg-[#1a1a2e]"
              }`}
            >
              {initials}
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <span className="text-[14px] font-semibold text-[#1a1a2e]">
                  {msg.authorName}
                </span>
                {msg.isInternal && (
                  <span className="rounded-[4px] bg-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                    Internal Note
                  </span>
                )}
                {isStaff && (
                  <span className="rounded-[4px] bg-[#eff6ff] px-2 py-0.5 text-[11px] font-semibold text-[#3b82f6]">
                    Support Team
                  </span>
                )}
                <span className="text-[12px] text-[#a1a1aa]">
                  {formatDate(msg.createdAt)}
                </span>
              </div>
              <div className="text-[14px] leading-[1.5] text-[#52525b]">
                <MarkdownBody content={msg.body} />
              </div>
              {msg.attachmentsWithUrls.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-2">
                  {msg.attachmentsWithUrls.map((att, i) =>
                    att.url ? (
                      att.contentType.startsWith("image/") ? (
                        <a
                          key={i}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-[8px] bg-[#eff6ff] px-3 py-2 text-[13px] font-medium text-[#3b82f6] hover:bg-[#dbeafe] transition-colors"
                        >
                          <ImageIcon className="h-4 w-4" />
                          {att.fileName}
                        </a>
                      ) : (
                        <a
                          key={i}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-[8px] bg-[#eff6ff] px-3 py-2 text-[13px] font-medium text-[#3b82f6] hover:bg-[#dbeafe] transition-colors"
                        >
                          <FileText className="h-4 w-4" />
                          {att.fileName}
                        </a>
                      )
                    ) : null
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
