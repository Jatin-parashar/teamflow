import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { updateTask, fetchTaskById } from "@/features/taskSlice";
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
import {
  type TaskStatus,
  Priority,
  RequestStatus,
} from "@/features/types";
import { ArrowLeft, Edit3 } from "lucide-react";
import { logActivity } from "@/firebase/activityLog";
import LoaderIcon from "@/components/ui/loader";

const EditTaskPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams();
  const { user } = useAppSelector((state) => state.auth);
  const { projects } = useAppSelector((state) => state.projects);
  const { currentTask, status } = useAppSelector((state) => state.tasks);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "To Do" as TaskStatus,
    priority: Priority.MEDIUM as Priority,
    projectId: "",
    assignedTo: "",
    dueDate: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableMembers, setAvailableMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (id) {
        try {
          await Promise.all([
            dispatch(fetchTaskById(id)),
            dispatch(fetchProjects()),
          ]);
        } catch (error) {
          toast.error("Failed to load task data");
        }
      }
      setLoading(false);
    };

    loadData();
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
      if (dueDate < today && formData.status !== "Done") {
        newErrors.dueDate =
          "Due date cannot be in the past unless task is completed";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !id) {
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

    const updates = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      status: formData.status,
      priority: formData.priority,
      projectId: formData.projectId,
      projectName: selectedProject.title,
      assignedTo: formData.assignedTo,
      assignedToName: selectedAssignee.name,
      assignedToEmail: selectedAssignee.email,
      dueDate: formData.dueDate,
    };

    try {
      const result = await dispatch(updateTask({ id, updates }));
      if (updateTask.fulfilled.match(result)) {
        if (user) await logActivity(user.id, user.name, "Updated task", "task", id, formData.title.trim());
        toast.success("Task updated successfully!");
        navigate(`/tasks/${id}`);
      } else {
        toast.error((result.payload as string) || "Failed to update task");
      }
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  if (loading) {
    return (
      <LoaderIcon />
    );
  }

  if (!currentTask) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-2">Task not found</h2>
        <p className="text-muted-foreground mb-4">
          The task you're looking for doesn't exist or has been deleted.
        </p>
        <Button onClick={() => navigate("/tasks")}>Back to Tasks</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/tasks/${id}`)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Task
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Task</h1>
          <p className="text-muted-foreground">Update task information</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle
            className="flex items-center gap-2"
          >
            <Edit3 className="w-5 h-5" />
            Task Details
          </CardTitle>
          <CardDescription>
            Make changes to the task information below
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
                    <SelectItem value={Priority.CRITICAL}>Critical</SelectItem>
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
                  disabled={!formData.projectId}
                >
                  <SelectTrigger
                    className={errors.assignedTo ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select assignee" />
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
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="To Do">To Do</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Done">Done</SelectItem>
                    <SelectItem value="Blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange("dueDate", e.target.value)}
                  className={errors.dueDate ? "border-red-500" : ""}
                />
                {errors.dueDate && (
                  <p className="text-sm text-red-500">{errors.dueDate}</p>
                )}
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Task Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Created by:</span>{" "}
                  {currentTask.createdByName}
                </div>
                <div>
                  <span className="font-medium">Created on:</span>{" "}
                  {new Date(currentTask.createdAt).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Last updated:</span>{" "}
                  {new Date(currentTask.updatedAt).toLocaleDateString()}
                </div>
                {currentTask.completedAt && (
                  <div>
                    <span className="font-medium">Completed on:</span>{" "}
                    {new Date(currentTask.completedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={status === RequestStatus.LOADING}
              >
                {status === RequestStatus.LOADING
                  ? "Updating..."
                  : "Update Task"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/tasks/${id}`)}
                disabled={status === RequestStatus.LOADING}
                className="cursor-pointer"
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
