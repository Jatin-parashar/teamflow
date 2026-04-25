import { useEffect, useState, useRef } from "react";
import { useAppSelector } from "@/app/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  fetchAttachments,
  uploadAttachment,
  deleteAttachment,
} from "@/firebase/attachments";
import { Permissions, type Attachment } from "@/features/types";
import {
  Paperclip,
  Upload,
  Trash2,
  FileText,
  Loader2,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface TaskAttachmentsProps {
  taskId: string;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const TaskAttachments: React.FC<TaskAttachmentsProps> = ({ taskId }) => {
  const { user } = useAppSelector((s) => s.auth);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canUpload = user ? Permissions.canUploadFiles(user.role) : false;

  useEffect(() => {
    setLoading(true);
    fetchAttachments(taskId)
      .then(setAttachments)
      .catch(() => toast.error("Failed to load attachments"))
      .finally(() => setLoading(false));
  }, [taskId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const attachment = await uploadAttachment(
        taskId,
        file,
        user.id,
        user.name
      );
      setAttachments((prev) => [attachment, ...prev]);
      toast.success("File uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (attachment: Attachment) => {
    try {
      await deleteAttachment(taskId, attachment);
      setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
      toast.success("File deleted");
    } catch {
      toast.error("Failed to delete file");
    }
  };

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            Attachments ({attachments.length})
          </CardTitle>
          {canUpload && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleUpload}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                )}
                Upload
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-4">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : attachments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No attachments yet.
          </p>
        ) : (
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-3 p-2 rounded-md border border-border"
              >
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {attachment.fileName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.fileSize)} ·{" "}
                    {attachment.uploadedByName} ·{" "}
                    {formatDistanceToNow(new Date(attachment.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    asChild
                  >
                    <a
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                  {user?.id === attachment.uploadedBy && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDelete(attachment)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskAttachments;
