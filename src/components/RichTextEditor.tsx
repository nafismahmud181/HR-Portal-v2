"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import MDEditor to avoid SSR issues
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  availableFields?: Array<{
    key: string;
    label: string;
    description?: string;
  }>;
}

export default function RichTextEditor({
  value,
  onChange,
  availableFields = [],
}: RichTextEditorProps) {
  const [showPlaceholderMenu, setShowPlaceholderMenu] = useState(false);

  const insertPlaceholder = (fieldKey: string) => {
    const placeholder = `{{${fieldKey}}}`;
    const currentValue = value || "";
    const newValue = currentValue + placeholder;
    onChange(newValue);
    setShowPlaceholderMenu(false);
  };

  return (
    <div className="relative">
      <div className="mb-2 flex items-center justify-between">
        <label className="text-[12px] font-medium text-[#374151]">
          Letter Content
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPlaceholderMenu(!showPlaceholderMenu)}
            className="px-3 py-1 text-[12px] border border-[#d1d5db] rounded-md hover:bg-[#f9fafb] bg-white"
          >
            Insert Field
          </button>
          {showPlaceholderMenu && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-[#e5e7eb] rounded-md shadow-lg z-10 max-h-64 overflow-y-auto">
              <div className="p-2">
                <div className="text-[12px] font-medium text-[#6b7280] mb-2">
                  Available Fields
                </div>
                <div className="space-y-1">
                  {availableFields.map((field) => (
                    <button
                      key={field.key}
                      type="button"
                      onClick={() => insertPlaceholder(field.key)}
                      className="w-full text-left px-2 py-1 text-[12px] hover:bg-[#f3f4f6] rounded flex flex-col"
                    >
                      <span className="font-medium">{field.label}</span>
                      {field.description && (
                        <span className="text-[#6b7280] text-[11px]">
                          {field.description}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="border border-[#d1d5db] rounded-md overflow-hidden">
        <MDEditor
          value={value}
          onChange={(val) => onChange(val || "")}
          data-color-mode="light"
          height={200}
          style={{
            backgroundColor: "white",
          }}
        />
      </div>
      <div className="mt-2 text-[11px] text-[#6b7280]">
        Use the &quot;Insert Field&quot; button to add dynamic placeholders that will be
        replaced with actual employee data. You can use Markdown formatting or switch to HTML mode.
      </div>
    </div>
  );
}
