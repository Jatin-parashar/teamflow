import { useEffect, useState } from "react";
import { useAppSelector } from "@/app/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  fetchComments,
  addComment,
  deleteComment,
  updateComment,
} from "@/firebase/comments";
import { Permissions, type Comment } from "@/features/types";
import { MessageSquare, Send, Trash2, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface TaskCommentsProps {
  taskId: string;
}

const TaskComments: React.FC<TaskCommentsProps> = ({ taskId }) => {
  const { user } = useAppSelector((s) => s.auth);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canComment = user ? Permissions.canComment(user.role) : false;

  useEffect(() => {
    setLoading(true);
    fetchComments(taskId)
      .then(setComments)
      .catch(() => toast.error("Failed to load comments"))
      .finally(() => setLoading(false));
  }, [taskId]);

  const handleAdd = async () => {
    if (!text.trim() || !user) return;
    setSubmitting(true);
    try {
      const comment = await addComment(taskId, user.id, user.name, text.trim());
      setComments((prev) => [...prev, comment]);
      setText("");
    } catch {
      toast.error("Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment(taskId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editText.trim()) return;
    try {
      await updateComment(taskId, commentId, editText.trim());
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                text: editText.trim(),
                editedAt: new Date().toISOString(),
              }
            : c
        )
      );
      setEditingId(null);
      setEditText("");
    } catch {
      toast.error("Failed to update comment");
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="pt-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No comments yet.
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getInitials(comment.userName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {comment.userName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                    {comment.editedAt && (
                      <span className="text-xs text-muted-foreground italic">
                        (edited)
                      </span>
                    )}
                  </div>
                  {editingId === comment.id ? (
                    <div className="mt-1 space-y-2">
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="min-h-[60px] text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(comment.id)}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-0.5 break-words">
                      {comment.text}
                    </p>
                  )}
                  {user?.id === comment.userId && editingId !== comment.id && (
                    <div className="flex gap-1 mt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5 text-xs text-muted-foreground"
                        onClick={() => {
                          setEditingId(comment.id);
                          setEditText(comment.text);
                        }}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5 text-xs text-destructive"
                        onClick={() => handleDelete(comment.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {canComment && (
          <div className="flex gap-2 pt-2">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a comment..."
              className="min-h-[60px] text-sm flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAdd();
                }
              }}
            />
            <Button
              size="icon"
              onClick={handleAdd}
              disabled={!text.trim() || submitting}
              className="shrink-0 self-end"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskComments;
