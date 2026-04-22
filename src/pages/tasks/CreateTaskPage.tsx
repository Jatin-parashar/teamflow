import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { createTask } from "@/features/taskSlice";
import { fetchProjects } from "@/features/projectSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Priority, RequestStatus, TaskStatus } from "@/features/types";
import type { ProjectMember } from "@/features/projectSlice";
import { Plus, FolderOpen, Loader2 } from "lucide-react";
import { logActivity } from "@/firebase/activityLog";
import PageHeader from "@/components/PageHeader";
import FormField from "@/components/FormField";
import { sanitize } from "@/utils/sanitize";

const CreateTaskPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const { projects } = useAppSelector((s) => s.projects);
  const { status } = useAppSelector((s) => s.tasks);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: TaskStatus.TO_DO as TaskStatus,
    priority: Priority.MEDIUM as Priority,
    projectId: searchParams.get("projectId") || "",
    assignedTo: "",
    dueDate: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableMembers, setAvailableMembers] = useState<ProjectMember[]>([]);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  useEffect(() => {
    if (formData.projectId) {
      const p = projects.find((p) => p.id === formData.projectId);
      setAvailableMembers(p?.members || []);
      setFormData((prev) => ({ ...prev, assignedTo: "" }));
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
      if (due < today) e.dueDate = "Due date cannot be in the past";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the errors in the form");
      return;
    }
    const selectedProject = projects.find((p) => p.id === formData.projectId);
    const selectedAssignee = availableMembers.find(
      (m) => m.userId === formData.assignedTo
    );
    if (!selectedProject || !selectedAssignee || !user) {
      toast.error("Missing required information");
      return;
    }

    try {
      const result = await dispatch(
        createTask({
          title: sanitize(formData.title.trim()),
          description: sanitize(formData.description.trim()),
          status: formData.status,
          priority: formData.priority,
          projectId: formData.projectId,
          projectName: selectedProject.title,
          assignedTo: formData.assignedTo,
          assignedToName: selectedAssignee.name,
          assignedToEmail: selectedAssignee.email,
          createdBy: user.id,
          createdByName: user.name,
          dueDate: formData.dueDate,
        })
      );
      if (createTask.fulfilled.match(result)) {
        await logActivity(
          user.id,
          user.name,
          "Created task",
          "task",
          result.payload.id,
          formData.title.trim()
        );
        toast.success("Task created successfully!");
        navigate("/tasks");
      } else {
        toast.error((result.payload as string) || "Failed to create task");
      }
    } catch {
      toast.error("Failed to create task");
    }
  };

  const set = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  if (!projects.length) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader
          title="Create Task"
          backTo="/tasks"
          backLabel="Back to Tasks"
        />
        <Alert>
          <FolderOpen className="h-4 w-4" />
          <AlertDescription>
            You must create a project before creating a task.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Create New Task"
        description="Add a new task to your project"
        backTo="/tasks"
        backLabel="Back to Tasks"
      />

      <Card className="border border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4 text-muted-foreground" />
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
              <FormField id="status" label="Initial Status">
                <div className="h-9 flex items-center">
                  <Badge variant="outline" className="text-sm">
                    {TaskStatus.TO_DO}
                  </Badge>
                </div>
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
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1.5" />
                    Create Task
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate("/tasks")}
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

export default CreateTaskPage;
