import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { createTask } from "@/features/taskSlice";
import { fetchProjects } from "@/features/projectSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Priority, RequestStatus, TaskStatus } from "@/features/types";
import type { ProjectMember } from "@/features/projectSlice";
import { ArrowLeft, Plus } from "lucide-react";
import { logActivity } from "@/firebase/activityLog";

const CreateTaskPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { projects } = useAppSelector((state) => state.projects);
  const hasProjects = projects && projects.length > 0;

  const { status } = useAppSelector((state) => state.tasks);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: TaskStatus.TO_DO as TaskStatus,
    priority: Priority.MEDIUM as Priority,
    projectId: "",
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
      const selectedProject = projects.find((p) => p.id === formData.projectId);
      if (selectedProject) {
        setAvailableMembers(selectedProject.members || []);
      }
    }
  }, [formData.projectId, projects]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.trim().length > 100) {
      newErrors.title = "Title must be under 100 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.trim().length > 1000) {
      newErrors.description = "Description must be under 1000 characters";
    }

    if (!formData.projectId) {
      newErrors.projectId = "Project is required";
    }

    if (!formData.assignedTo) {
      newErrors.assignedTo = "Assignee is required";
    }

    if (!formData.dueDate) {
      newErrors.dueDate = "Due date is required";
    } else {
      const dueDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dueDate < today) {
        newErrors.dueDate = "Due date cannot be in the past";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
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

    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
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
    };

    try {
      const result = await dispatch(createTask(taskData));
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
    } catch (_error) {
      toast.error("Failed to create task");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/tasks")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tasks
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create New Task</h1>
          <p className="text-muted-foreground">
            Add a new task to your project
          </p>
        </div>
      </div>

      {hasProjects ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Task Details
            </CardTitle>
            <CardDescription>
              Fill in the information below to create a new task
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter task title"
                    value={formData.title}
                    maxLength={100}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className={errors.title ? "border-red-500" : ""}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500">{errors.title}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      handleInputChange("priority", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Priority.LOW}>Low</SelectItem>
                      <SelectItem value={Priority.MEDIUM}>Medium</SelectItem>
                      <SelectItem value={Priority.HIGH}>High</SelectItem>
                      <SelectItem value={Priority.CRITICAL}>
                        Critical
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Enter task description"
                  value={formData.description}
                  maxLength={1000}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  className={errors.description ? "border-red-500" : ""}
                  rows={4}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project">Project *</Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(value) =>
                      handleInputChange("projectId", value)
                    }
                  >
                    <SelectTrigger
                      className={errors.projectId ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.projectId && (
                    <p className="text-sm text-red-500">{errors.projectId}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Assign To *</Label>
                  <Select
                    value={formData.assignedTo}
                    onValueChange={(value) =>
                      handleInputChange("assignedTo", value)
                    }
                    disabled={
                      !formData.projectId || availableMembers.length === 0
                    }
                  >
                    <SelectTrigger
                      className={errors.assignedTo ? "border-red-500" : ""}
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
                      {availableMembers.map((member) => (
                        <SelectItem key={member.userId} value={member.userId}>
                          {member.name} ({member.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.assignedTo && (
                    <p className="text-sm text-red-500">{errors.assignedTo}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="status">Status</Label>
                  <div className="text-xs font-semibold border inline py-2 px-4 rounded-lg">
                    {TaskStatus.TO_DO}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      handleInputChange("dueDate", e.target.value)
                    }
                    className={errors.dueDate ? "border-red-500" : ""}
                  />
                  {errors.dueDate && (
                    <p className="text-sm text-red-500">{errors.dueDate}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <Button
                  type="submit"
                  className={`text-neutral-100 bg-neutral-600 cursor-pointer hover:text-white hover:bg-neutral-800`}
                  disabled={status === RequestStatus.LOADING}
                >
                  {status === RequestStatus.LOADING
                    ? "Creating..."
                    : "Create Task"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/tasks")}
                  disabled={status === RequestStatus.LOADING}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-20">
          <h2 className="text-xl font-semibold mb-2">No projects found</h2>
          <p className="text-muted-foreground mb-6">
            You must create a project before creating a task.
          </p>
        </div>
      )}
    </div>
  );
};

export default CreateTaskPage;
