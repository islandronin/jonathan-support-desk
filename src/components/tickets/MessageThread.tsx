"use client";

import { MarkdownBody } from "./MarkdownBody";
import { formatDate } from "@/lib/utils";

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
    <div className="space-y-4">
      {messages.map((msg) => (
        <div
          key={msg._id}
          className={`rounded-lg p-4 ${
            msg.isInternal
              ? "bg-amber-50 border border-amber-200"
              : msg.authorRole === "customer"
                ? "bg-white border border-gray-200"
                : "bg-blue-50 border border-blue-200"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">
                {msg.authorName}
              </span>
              {msg.isInternal && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-amber-200 text-amber-800 font-medium">
                  Internal Note
                </span>
              )}
              {msg.authorRole !== "customer" && !msg.isInternal && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-blue-200 text-blue-800 font-medium">
                  Staff
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500">
              {formatDate(msg.createdAt)}
            </span>
          </div>
          <MarkdownBody content={msg.body} />
          {msg.attachmentsWithUrls.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {msg.attachmentsWithUrls.map((att, i) =>
                att.url ? (
                  att.contentType.startsWith("image/") ? (
                    <a
                      key={i}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={att.url}
                        alt={att.fileName}
                        className="h-20 rounded border border-gray-200"
                      />
                    </a>
                  ) : (
                    <a
                      key={i}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {att.fileName}
                    </a>
                  )
                ) : null
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
