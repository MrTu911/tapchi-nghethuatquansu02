import { Search, X } from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ConversationSearch({
  value,
  onChange,
  placeholder = 'Tìm kiếm hội thoại...',
}: Props) {
  return (
    <div className="relative px-3 py-2.5 border-b bg-background/60">
      <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-8 pr-7 h-8 text-sm rounded-lg border bg-background/80 px-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground/60"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted p-0.5 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
