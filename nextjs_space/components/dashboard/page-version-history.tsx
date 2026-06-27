"use client";

import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { History, RotateCcw, Loader2, Clock, User as UserIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PageVersion {
  id: string;
  versionNo: number;
  title: string;
  changeNote?: string | null;
  createdByName?: string | null;
  createdAt: string;
}

interface PageVersionHistoryProps {
  pageId: string;
  onRestored?: () => void;
  trigger?: ReactNode;
}

/**
 * Panel "Lịch sử phiên bản" của một trang public.
 * Liệt kê các snapshot và cho phép khôi phục về một bản cũ.
 */
export function PageVersionHistory({
  pageId,
  onRestored,
  trigger,
}: PageVersionHistoryProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState<PageVersion[]>([]);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [confirmVersion, setConfirmVersion] = useState<PageVersion | null>(null);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/public-pages/${pageId}/versions`);
      const data = await res.json();
      if (data.success) {
        setVersions(data.data);
      } else {
        toast.error(data.message || "Không thể tải lịch sử phiên bản");
      }
    } catch {
      toast.error("Lỗi khi tải lịch sử phiên bản");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) fetchVersions();
  };

  const handleRestore = async (version: PageVersion) => {
    setRestoringId(version.id);
    try {
      const res = await fetch(
        `/api/public-pages/${pageId}/versions/${version.id}/restore`,
        { method: "POST" }
      );
      const data = await res.json();
      if (data.success) {
        toast.success(`Đã khôi phục về phiên bản v${version.versionNo}`);
        setConfirmVersion(null);
        setOpen(false);
        onRestored?.();
      } else {
        toast.error(data.message || "Không thể khôi phục phiên bản");
      }
    } catch {
      toast.error("Lỗi khi khôi phục phiên bản");
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>
          {trigger ?? (
            <Button variant="outline" size="sm" className="gap-2">
              <History className="h-4 w-4" />
              Lịch sử
            </Button>
          )}
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-md flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-emerald-700" />
              Lịch sử phiên bản
            </SheetTitle>
            <SheetDescription>
              Mỗi lần lưu tay hoặc xuất bản tạo một bản lưu. Bạn có thể khôi phục
              về bản cũ; bản hiện tại sẽ được lưu lại trước khi khôi phục.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 mt-4 -mx-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-700" />
                <p className="text-sm text-muted-foreground">Đang tải...</p>
              </div>
            ) : versions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2 px-6 text-center">
                <Clock className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Chưa có phiên bản nào. Lưu thay đổi để tạo bản lưu đầu tiên.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-220px)] px-6">
                <ul className="space-y-3">
                  {versions.map((v, idx) => (
                    <li
                      key={v.id}
                      className="rounded-lg border p-3 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            v{v.versionNo}
                          </Badge>
                          {idx === 0 && (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 text-[10px]">
                              Mới nhất
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1.5 text-xs"
                          onClick={() => setConfirmVersion(v)}
                          disabled={restoringId !== null}
                        >
                          {restoringId === v.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3.5 w-3.5" />
                          )}
                          Khôi phục
                        </Button>
                      </div>
                      <p className="text-sm font-medium line-clamp-1">{v.title}</p>
                      {v.changeNote && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {v.changeNote}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(v.createdAt).toLocaleString("vi-VN")}
                        </span>
                        {v.createdByName && (
                          <span className="flex items-center gap-1">
                            <UserIcon className="h-3 w-3" />
                            {v.createdByName}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={confirmVersion !== null}
        onOpenChange={(o) => !o && setConfirmVersion(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-amber-600" />
              Khôi phục phiên bản v{confirmVersion?.versionNo}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Nội dung trang (tiêu đề, nội dung, SEO, template) sẽ được thay thế
              bằng nội dung của phiên bản này. Trạng thái xuất bản và slug giữ
              nguyên. Bản hiện tại sẽ được lưu lại để bạn có thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmVersion && handleRestore(confirmVersion)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              Khôi phục
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
