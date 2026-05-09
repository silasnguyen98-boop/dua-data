"use client";

import { useRef, useCallback, useEffect } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  editorClassName?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = "300px",
  maxHeight = "500px",
  editorClassName = "",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastRangeRef = useRef<Range | null>(null);

  const fontSizeOptions = [
    { label: "10", value: "10px" },
    { label: "12", value: "12px" },
    { label: "14", value: "14px" },
    { label: "16", value: "16px" },
    { label: "18", value: "18px" },
    { label: "20", value: "20px" },
    { label: "24", value: "24px" },
    { label: "28", value: "28px" },
  ];

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (value || "")) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const syncChange = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const saveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
      lastRangeRef.current = range.cloneRange();
    }
  }, []);

  const restoreSelection = useCallback(() => {
    const selection = window.getSelection();
    const range = lastRangeRef.current;
    if (!selection || !range) return false;
    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  }, []);

  const execCmd = useCallback((command: string, val?: string) => {
    restoreSelection();
    document.execCommand(command, false, val);
    saveSelection();
    syncChange();
  }, [restoreSelection, saveSelection, syncChange]);

  const applyFontSize = useCallback((size: string) => {
    if (!editorRef.current) return;

    restoreSelection();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (!editorRef.current.contains(range.commonAncestorContainer)) return;

    const span = document.createElement("span");
    span.style.fontSize = size;
    span.setAttribute("data-font-size", size);

    if (range.collapsed) {
      span.innerHTML = "&#8203;";
      range.insertNode(span);
      const newRange = document.createRange();
      newRange.setStart(span, 1);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    } else {
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      selection.addRange(newRange);
    }

    syncChange();
  }, [restoreSelection, syncChange]);

  const handleInput = useCallback(() => {
    saveSelection();
    syncChange();
  }, [saveSelection, syncChange]);

  const handleSelectionChange = useCallback(() => {
    saveSelection();
  }, [saveSelection]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertHTML", false, html || text);
    syncChange();
  }, [syncChange]);

  const insertLink = useCallback(() => {
    const url = prompt("Nhập URL:");
    if (url) execCmd("createLink", url);
  }, [execCmd]);

  const insertImage = useCallback(() => {
    const url = prompt("Nhập URL ảnh:");
    if (url) execCmd("insertImage", url);
  }, [execCmd]);

  const insertHorizontalRule = useCallback(() => {
    execCmd("insertHorizontalRule");
  }, [execCmd]);

  const btnClass =
    "px-2.5 py-1.5 rounded-lg border border-transparent hover:border-green-200 hover:bg-green-50 text-gray-600 hover:text-green-700 transition text-sm font-medium min-w-[34px] flex items-center justify-center";
  const sepClass = "w-px h-5 bg-gray-200 mx-0.5";

  return (
    <div className="border rounded-2xl overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500">
      <div className="flex flex-wrap items-center gap-1 px-2.5 py-2 bg-gradient-to-r from-gray-50 to-white border-b sticky top-0 z-10">
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCmd("undo")} className={btnClass} title="Undo">↶</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCmd("redo")} className={btnClass} title="Redo">↷</button>

        <div className={sepClass} />

        <select
          onChange={(e) => {
            const size = e.target.value;
            if (size) applyFontSize(size);
            e.target.value = "";
          }}
          className="text-xs border rounded-lg px-2 py-1 bg-white text-gray-700"
          title="Size chữ"
          defaultValue=""
        >
          <option value="" disabled>Size</option>
          {fontSizeOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>

        <div className={sepClass} />

        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCmd("bold")} className={btnClass} title="Bold"><strong>B</strong></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCmd("italic")} className={btnClass} title="Italic"><em>I</em></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCmd("underline")} className={btnClass} title="Underline"><u>U</u></button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCmd("strikethrough")} className={btnClass} title="Strikethrough"><s>S</s></button>

        <div className={sepClass} />

        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCmd("formatBlock", "h2")} className={btnClass} title="Heading 2">H2</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCmd("formatBlock", "h3")} className={btnClass} title="Heading 3">H3</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCmd("formatBlock", "p")} className={btnClass} title="Paragraph">P</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertHorizontalRule()} className={btnClass} title="Horizontal rule">—</button>

        <div className={sepClass} />

        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCmd("insertUnorderedList")} className={btnClass} title="Bullet list">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /><circle cx="1" cy="6" r="1" fill="currentColor"/><circle cx="1" cy="12" r="1" fill="currentColor"/><circle cx="1" cy="18" r="1" fill="currentColor"/></svg>
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCmd("insertOrderedList")} className={btnClass} title="Numbered list">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
        </button>

        <div className={sepClass} />

        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCmd("justifyLeft")} className={btnClass} title="Align left">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M3 12h12M3 18h18" /></svg>
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCmd("justifyCenter")} className={btnClass} title="Align center">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M6 12h12M3 18h18" /></svg>
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCmd("justifyRight")} className={btnClass} title="Align right">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M9 12h12M3 18h18" /></svg>
        </button>

        <div className={sepClass} />

        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={insertLink} className={btnClass} title="Insert link">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={insertImage} className={btnClass} title="Insert image">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCmd("formatBlock", "blockquote")} className={btnClass} title="Blockquote">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        </button>

        <div className={sepClass} />

        <select
          onChange={(e) => {
            if (e.target.value) execCmd("foreColor", e.target.value);
            e.target.value = "";
          }}
          className="text-xs border rounded-lg px-2 py-1 bg-white text-gray-700"
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

        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCmd("removeFormat")} className={btnClass} title="Clear formatting">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onMouseUp={handleSelectionChange}
        onKeyUp={handleSelectionChange}
        onPaste={handlePaste}
        className={`overflow-y-auto px-4 py-3 text-sm text-gray-900 focus:outline-none prose prose-sm max-w-none ${editorClassName}
          [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-2 [&_h1]:mt-4
          [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:mt-4
          [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-3
          [&_p]:mb-2
          [&_span[data-font-size]]:inline
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2
          [&_blockquote]:border-l-4 [&_blockquote]:border-green-400 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:my-2
          [&_a]:text-green-600 [&_a]:underline
          [&_img]:block [&_img]:mx-auto [&_img]:w-full [&_img]:max-w-[640px] [&_img]:aspect-video [&_img]:object-cover [&_img]:rounded-xl [&_img]:my-4
          [&_table]:w-full [&_table]:border-collapse [&_table]:my-3
          [&_td]:border [&_td]:border-gray-200 [&_td]:p-2 [&_th]:border [&_th]:border-gray-200 [&_th]:p-2 [&_th]:bg-gray-50`}
        data-placeholder={placeholder || "Nhập nội dung..."}
        style={{ minHeight, maxHeight }}
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
