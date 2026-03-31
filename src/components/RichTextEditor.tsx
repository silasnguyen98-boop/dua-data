"use client";

import { useRef, useCallback, useEffect, useState } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [initialized, setInitialized] = useState(false);

  // Set initial content only once
  useEffect(() => {
    if (editorRef.current && !initialized) {
      editorRef.current.innerHTML = value || "";
      setInitialized(true);
    }
  }, [value, initialized]);

  // Reset when value changes externally (e.g. switching between items)
  useEffect(() => {
    if (editorRef.current && initialized) {
      const current = editorRef.current.innerHTML;
      if (value !== current && (value === "" || !current)) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value, initialized]);

  const execCmd = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/html") || e.clipboardData.getData("text/plain");
    document.execCommand("insertHTML", false, text);
  }, []);

  const insertLink = useCallback(() => {
    const url = prompt("Nhập URL:");
    if (url) execCmd("createLink", url);
  }, [execCmd]);

  const insertImage = useCallback(() => {
    const url = prompt("Nhập URL ảnh:");
    if (url) execCmd("insertImage", url);
  }, [execCmd]);

  const btnClass = "p-1.5 rounded hover:bg-green-100 text-gray-600 hover:text-green-700 transition text-sm font-medium min-w-[28px] flex items-center justify-center";
  const sepClass = "w-px h-5 bg-gray-200 mx-0.5";

  return (
    <div className="border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b">
        <button type="button" onClick={() => execCmd("bold")} className={btnClass} title="Bold">
          <strong>B</strong>
        </button>
        <button type="button" onClick={() => execCmd("italic")} className={btnClass} title="Italic">
          <em>I</em>
        </button>
        <button type="button" onClick={() => execCmd("underline")} className={btnClass} title="Underline">
          <u>U</u>
        </button>
        <button type="button" onClick={() => execCmd("strikethrough")} className={btnClass} title="Strikethrough">
          <s>S</s>
        </button>

        <div className={sepClass} />

        <button type="button" onClick={() => execCmd("formatBlock", "h2")} className={btnClass} title="Heading 2">
          H2
        </button>
        <button type="button" onClick={() => execCmd("formatBlock", "h3")} className={btnClass} title="Heading 3">
          H3
        </button>
        <button type="button" onClick={() => execCmd("formatBlock", "p")} className={btnClass} title="Paragraph">
          P
        </button>

        <div className={sepClass} />

        <button type="button" onClick={() => execCmd("insertUnorderedList")} className={btnClass} title="Bullet list">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /><circle cx="1" cy="6" r="1" fill="currentColor"/><circle cx="1" cy="12" r="1" fill="currentColor"/><circle cx="1" cy="18" r="1" fill="currentColor"/></svg>
        </button>
        <button type="button" onClick={() => execCmd("insertOrderedList")} className={btnClass} title="Numbered list">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
        </button>

        <div className={sepClass} />

        <button type="button" onClick={() => execCmd("justifyLeft")} className={btnClass} title="Align left">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M3 12h12M3 18h18" /></svg>
        </button>
        <button type="button" onClick={() => execCmd("justifyCenter")} className={btnClass} title="Align center">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M6 12h12M3 18h18" /></svg>
        </button>

        <div className={sepClass} />

        <button type="button" onClick={insertLink} className={btnClass} title="Insert link">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
        </button>
        <button type="button" onClick={insertImage} className={btnClass} title="Insert image">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </button>
        <button type="button" onClick={() => execCmd("formatBlock", "blockquote")} className={btnClass} title="Blockquote">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        </button>

        <div className={sepClass} />

        <select
          onChange={(e) => { if (e.target.value) execCmd("foreColor", e.target.value); e.target.value = ""; }}
          className="text-xs border rounded px-1 py-0.5 bg-white"
          title="Text color"
          defaultValue=""
        >
          <option value="" disabled>Color</option>
          <option value="#000000">Black</option>
          <option value="#16a34a">Green</option>
          <option value="#2563eb">Blue</option>
          <option value="#dc2626">Red</option>
          <option value="#9333ea">Purple</option>
          <option value="#ea580c">Orange</option>
        </select>

        <div className={sepClass} />

        <button type="button" onClick={() => execCmd("removeFormat")} className={btnClass} title="Clear formatting">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        className="min-h-[300px] max-h-[500px] overflow-y-auto px-4 py-3 text-sm text-gray-900 focus:outline-none prose prose-sm max-w-none
          [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:mt-4
          [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-3
          [&_p]:mb-2
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2
          [&_blockquote]:border-l-4 [&_blockquote]:border-green-400 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:my-2
          [&_a]:text-green-600 [&_a]:underline
          [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2"
        data-placeholder={placeholder || "Nhập nội dung bài viết..."}
        style={{ minHeight: "300px" }}
      />

      <style jsx>{`
        [contentEditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
