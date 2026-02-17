"use client";

import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRef, useState, useCallback } from "react";
import type { Id } from "../../../convex/_generated/dataModel";

type Attachment = {
  storageId: Id<"_storage">;
  fileName: string;
  contentType: string;
  size: number;
  previewUrl?: string;
};

export function AttachmentUpload({
  attachments,
  onAttachmentsChange,
}: {
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
}) {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList) => {
      setUploading(true);
      const newAttachments: Attachment[] = [];

      for (const file of Array.from(files)) {
        const url = await generateUploadUrl();
        const result = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await result.json();

        const att: Attachment = {
          storageId,
          fileName: file.name,
          contentType: file.type,
          size: file.size,
        };

        if (file.type.startsWith("image/")) {
          att.previewUrl = URL.createObjectURL(file);
        }

        newAttachments.push(att);
      }

      onAttachmentsChange([...attachments, ...newAttachments]);
      setUploading(false);
    },
    [attachments, generateUploadUrl, onAttachmentsChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const removeAttachment = (index: number) => {
    const updated = attachments.filter((_, i) => i !== index);
    onAttachmentsChange(updated);
  };

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        {uploading ? (
          <p className="text-sm text-gray-500">Uploading...</p>
        ) : (
          <p className="text-sm text-gray-500">
            Drop files here or click to browse
          </p>
        )}
      </div>

      {attachments.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {attachments.map((att, i) => (
            <div
              key={i}
              className="flex items-center gap-2 bg-gray-50 rounded px-2 py-1 text-sm"
            >
              {att.previewUrl ? (
                <img
                  src={att.previewUrl}
                  alt={att.fileName}
                  className="h-8 w-8 object-cover rounded"
                />
              ) : null}
              <span className="text-gray-700 truncate max-w-[150px]">
                {att.fileName}
              </span>
              <button
                type="button"
                onClick={() => removeAttachment(i)}
                className="text-gray-400 hover:text-red-500"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
