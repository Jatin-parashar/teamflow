import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { updateTask, type Task } from "@/features/taskSlice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Permissions, type Subtask } from "@/features/types";
import { ListChecks, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

interface TaskSubtasksProps {
  task: Task;
}

const TaskSubtasks: React.FC<TaskSubtasksProps> = ({ task }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const [newText, setNewText] = useState("");
  const [saving, setSaving] = useState(false);

  const subtasks = task.subtasks || [];
  const completed = subtasks.filter((s) => s.completed).length;
  const progress =
    subtasks.length > 0 ? (completed / subtasks.length) * 100 : 0;
  const canEdit = user ? Permissions.canEditTasks(user.role) : false;

  const save = async (updated: Subtask[]) => {
    setSaving(true);
    try {
      await dispatch(
        updateTask({ id: task.id, updates: { subtasks: updated } })
      ).unwrap();
    } catch {
      toast.error("Failed to update subtasks");
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!newText.trim() || saving) return;
    const text = newText.trim();
    setNewText("");
    await save([
      ...subtasks,
      { id: uuidv4().slice(0, 8), text, completed: false },
    ]);
  };

  const handleToggle = (id: string) => {
    save(
      subtasks.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleDelete = (id: string) => {
    save(subtasks.filter((s) => s.id !== id));
  };

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-muted-foreground" />
          Subtasks ({completed}/{subtasks.length})
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="pt-4 space-y-3">
        {subtasks.length > 0 && <Progress value={progress} className="h-1.5" />}

        {subtasks.map((subtask) => (
          <div key={subtask.id} className="flex items-center gap-2">
            <Checkbox
              checked={subtask.completed}
              onCheckedChange={() => handleToggle(subtask.id)}
              disabled={saving || (!canEdit && user?.id !== task.assignedTo)}
            />
            <span
              className={`text-sm flex-1 ${subtask.completed ? "line-through text-muted-foreground" : ""}`}
            >
              {subtask.text}
            </span>
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive"
                onClick={() => handleDelete(subtask.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}

        {canEdit && (
          <div className="flex gap-2">
            <Input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Add subtask..."
              className="text-sm h-8"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleAdd}
              disabled={!newText.trim() || saving}
              className="h-8"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskSubtasks;
