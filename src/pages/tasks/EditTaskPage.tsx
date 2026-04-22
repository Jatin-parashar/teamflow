import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { updateTask, fetchTaskById } from "@/features/taskSlice";
import { fetchProjects } from "@/features/projectSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  type TaskStatus,
  TaskStatus as TS,
  Priority,
  RequestStatus,
} from "@/features/types";
import type { ProjectMember } from "@/features/projectSlice";
import { Edit3, Loader2 } from "lucide-react";
import { logActivity } from "@/firebase/activityLog";
import LoaderIcon from "@/components/ui/loader";
import PageHeader from "@/components/PageHeader";
import FormField from "@/components/FormField";
import { sanitize } from "@/utils/sanitize";

const EditTaskPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams();
  const { user } = useAppSelector((s) => s.auth);
  const { projects } = useAppSelector((s) => s.projects);
  const { currentTask, status } = useAppSelector((s) => s.tasks);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: TS.TO_DO as TaskStatus,
    priority: Priority.MEDIUM as Priority,
    projectId: "",
    assignedTo: "",
    dueDate: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableMembers, setAvailableMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (id) {
        try {
          await Promise.all([
            dispatch(fetchTaskById(id)),
            dispatch(fetchProjects()),
          ]);
        } catch {
          toast.error("Failed to load task data");
        }
      }
      setLoading(false);
    };
    load();
  }, [dispatch, id]);

  useEffect(() => {
    if (currentTask) {
      setFormData({
        title: currentTask.title,
        description: currentTask.description,
        status: currentTask.status,
        priority: currentTask.priority,
        projectId: currentTask.projectId,
        assignedTo: currentTask.assignedTo,
        dueDate: currentTask.dueDate,
      });
    }
  }, [currentTask]);

  useEffect(() => {
    if (formData.projectId) {
      const p = projects.find((p) => p.id === formData.projectId);
      setAvailableMembers(p?.members || []);
    }
  }, [formData.projectId, projects]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.title.trim()) e.title = "Title is required";
    else if (formData.title.trim().length > 100) e.title = "Max 100 characters";
    if (!formData.description.trim()) e.description = "Description is required";
    else if (formData.description.trim().length > 1000)
      e.description = "Max 1000 characters";
    if (!formData.projectId) e.projectId = "Project is required";
    if (!formData.assignedTo) e.assignedTo = "Assignee is required";
    if (!formData.dueDate) e.dueDate = "Due date is required";
    else {
      const due = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (due < today && formData.status !== TS.DONE)
        e.dueDate = "Due date cannot be in the past unless task is completed";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !id) {
      toast.error("Please fix the errors in the form");
      return;
    }
    const selectedProject = projects.find((p) => p.id === formData.projectId);
    const selectedAssignee = availableMembers.find(
      (m) => m.userId === formData.assignedTo
    );
    if (!selectedProject || !selectedAssignee) {
      toast.error("Missing required information");
      return;
    }

    try {
      const result = await dispatch(
        updateTask({
          id,
          updates: {
            title: sanitize(formData.title.trim()),
            description: sanitize(formData.description.trim()),
            status: formData.status,
            priority: formData.priority,
            projectId: formData.projectId,
            projectName: selectedProject.title,
            assignedTo: formData.assignedTo,
            assignedToName: selectedAssignee.name,
            assignedToEmail: selectedAssignee.email,
            dueDate: formData.dueDate,
          },
        })
      );
      if (updateTask.fulfilled.match(result)) {
        if (user)
          await logActivity(
            user.id,
            user.name,
            "Updated task",
            "task",
            id,
            formData.title.trim()
          );
        toast.success("Task updated successfully!");
        navigate(`/tasks/${id}`);
      } else {
        toast.error((result.payload as string) || "Failed to update task");
      }
    } catch {
      toast.error("Failed to update task");
    }
  };

  const set = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  if (loading) return <LoaderIcon />;
  if (!currentTask)
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader
          title="Edit Task"
          backTo="/tasks"
          backLabel="Back to Tasks"
        />
        <p className="text-muted-foreground text-center py-12">
          Task not found or has been deleted.
        </p>
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Edit Task"
        description="Update task information"
        backTo={`/tasks/${id}`}
        backLabel="Back to Task"
      />

      <Card className="border border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Edit3 className="h-4 w-4 text-muted-foreground" />
            Task Details
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                id="title"
                label="Task Title"
                required
                error={errors.title}
              >
                <Input
                  id="title"
                  placeholder="Enter task title"
                  value={formData.title}
                  maxLength={100}
                  onChange={(e) => set("title", e.target.value)}
                  className={`h-9 bg-background ${errors.title ? "border-destructive" : ""}`}
                />
              </FormField>
              <FormField id="priority" label="Priority">
                <Select
                  value={formData.priority}
                  onValueChange={(v) => set("priority", v)}
                >
                  <SelectTrigger className="h-9 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Priority.LOW}>Low</SelectItem>
                    <SelectItem value={Priority.MEDIUM}>Medium</SelectItem>
                    <SelectItem value={Priority.HIGH}>High</SelectItem>
                    <SelectItem value={Priority.CRITICAL}>Critical</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <FormField
              id="description"
              label="Description"
              required
              error={errors.description}
            >
              <Textarea
                id="description"
                placeholder="Enter task description"
                value={formData.description}
                maxLength={1000}
                rows={4}
                onChange={(e) => set("description", e.target.value)}
                className={`bg-background resize-none ${errors.description ? "border-destructive" : ""}`}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                id="project"
                label="Project"
                required
                error={errors.projectId}
              >
                <Select
                  value={formData.projectId}
                  onValueChange={(v) => set("projectId", v)}
                >
                  <SelectTrigger
                    className={`h-9 bg-background ${errors.projectId ? "border-destructive" : ""}`}
                  >
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField
                id="assignedTo"
                label="Assign To"
                required
                error={errors.assignedTo}
              >
                <Select
                  value={formData.assignedTo}
                  onValueChange={(v) => set("assignedTo", v)}
                  disabled={
                    !formData.projectId || availableMembers.length === 0
                  }
                >
                  <SelectTrigger
                    className={`h-9 bg-background ${errors.assignedTo ? "border-destructive" : ""}`}
                  >
                    <SelectValue
                      placeholder={
                        !formData.projectId
                          ? "Select a project first"
                          : availableMembers.length === 0
                            ? "No members in this project"
                            : "Select assignee"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMembers.map((m) => (
                      <SelectItem key={m.userId} value={m.userId}>
                        {m.name} ({m.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField id="status" label="Status">
                <Select
                  value={formData.status}
                  onValueChange={(v) => set("status", v)}
                >
                  <SelectTrigger className="h-9 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TS.TO_DO}>To Do</SelectItem>
                    <SelectItem value={TS.IN_PROGRESS}>In Progress</SelectItem>
                    <SelectItem value={TS.DONE}>Done</SelectItem>
                    <SelectItem value={TS.BLOCKED}>Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField
                id="dueDate"
                label="Due Date"
                required
                error={errors.dueDate}
              >
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => set("dueDate", e.target.value)}
                  className={`h-9 bg-background ${errors.dueDate ? "border-destructive" : ""}`}
                />
              </FormField>
            </div>

            {/* Task metadata */}
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-3">
                Task Information
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground">
                    Created by:{" "}
                  </span>
                  {currentTask.createdByName}
                </div>
                <div>
                  <span className="font-medium text-foreground">Created: </span>
                  {new Date(currentTask.createdAt).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium text-foreground">
                    Last updated:{" "}
                  </span>
                  {new Date(currentTask.updatedAt).toLocaleDateString()}
                </div>
                {currentTask.completedAt && (
                  <div>
                    <span className="font-medium text-foreground">
                      Completed:{" "}
                    </span>
                    {new Date(currentTask.completedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            <Separator />
            <div className="flex gap-3">
              <Button
                type="submit"
                size="sm"
                disabled={status === RequestStatus.LOADING}
              >
                {status === RequestStatus.LOADING ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Task"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate(`/tasks/${id}`)}
                disabled={status === RequestStatus.LOADING}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditTaskPage;
