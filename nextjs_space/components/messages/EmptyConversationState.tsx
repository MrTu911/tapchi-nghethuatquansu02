interface Props {
  title?: string;
  description?: string;
}

export function EmptyConversationState({
  title = 'Chọn một cuộc trò chuyện',
  description = 'Hoặc tạo cuộc trò chuyện mới để bắt đầu',
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground select-none px-6 bg-muted/10">
      <div className="relative mb-6">
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-accent/20 flex items-center justify-center shadow-inner">
          <svg
            className="h-10 w-10 text-primary/30"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        {/* Decorative dots */}
        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-accent/60" />
        <div className="absolute -bottom-1 -left-1 h-2 w-2 rounded-full bg-primary/20" />
      </div>
      <p className="text-base font-semibold text-foreground/60">{title}</p>
      <p className="text-sm mt-1 text-center text-muted-foreground/60 max-w-xs">{description}</p>
    </div>
  );
}
