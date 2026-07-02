'use client';

import { useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isSending: boolean;
  disabled?: boolean;
  placeholder?: string;
}

// Khớp với giới hạn phía API (zod max 5000) để tránh lệch validation.
const MAX_CHARS = 5000;

export function MessageInput({
  value,
  onChange,
  onSend,
  isSending,
  disabled = false,
  placeholder = 'Nhập tin nhắn... (Enter để gửi)',
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isSending && !disabled) {
        onSend();
      }
    }
  };

  const canSend = value.trim().length > 0 && !isSending && !disabled;
  const nearLimit = value.length > MAX_CHARS * 0.85;

  return (
    <div className="border-t bg-background/95 backdrop-blur-sm px-4 py-3 shrink-0">
      <div className="flex gap-2.5 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              if (e.target.value.length <= MAX_CHARS) {
                onChange(e.target.value);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isSending}
            rows={1}
            className="w-full resize-none min-h-[42px] max-h-[160px] text-sm py-2.5 px-4 rounded-2xl border bg-muted/40 hover:bg-muted/60 focus:bg-background outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50 transition-all overflow-y-auto placeholder:text-muted-foreground/50 disabled:opacity-60"
          />
          {nearLimit && (
            <span className="absolute bottom-2.5 right-4 text-[10px] text-muted-foreground/70 pointer-events-none">
              {value.length}/{MAX_CHARS}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          aria-label="Gửi tin nhắn"
          className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
            canSend
              ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md ring-1 ring-accent/40 hover:ring-accent/70 active:scale-95'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground/50 mt-1.5 ml-1">
        Shift + Enter để xuống dòng
      </p>
    </div>
  );
}
