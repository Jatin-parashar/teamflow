import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  AlertCircle,
  ArrowLeft,
  Calendar,
  FileText,
  Loader2,
  Save,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { fetchProjectById, updateProject } from "@/features/projectSlice";
import { logActivity } from "@/firebase/activityLog";
import {
  Priority,
  ProjectStatus,
  RequestStatus,
  type ProjectStatus as PS,
} from "@/features/types";
import LoaderIcon from "@/components/ui/loader";

const EditProjectPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentProject, status, error } = useAppSelector(
    (state) => state.projects
  );
  const { user } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: ProjectStatus.NOT_STARTED as PS,
    priority: Priority.MEDIUM as Priority,
    startDate: "",
    endDate: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchProjectById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (currentProject) {
      setFormData({
        title: currentProject.title,
        description: currentProject.description,
        status: currentProject.status,
        priority: currentProject.priority,
        startDate: currentProject.startDate
          ? currentProject.startDate.split("T")[0]
          : "",
        endDate: currentProject.endDate
          ? currentProject.endDate.split("T")[0]
          : "",
      });
    }
  }, [currentProject]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = "Project title is required";
    } else if (formData.title.trim().length > 100) {
      errors.title = "Project title must be under 100 characters";
    }

    if (!formData.description.trim()) {
      errors.description = "Project description is required";
    } else if (formData.description.trim().length > 1000) {
      errors.description = "Description must be under 1000 characters";
    }

    if (!formData.startDate) {
      errors.startDate = "Start date is required";
    }

    if (!formData.endDate) {
      errors.endDate = "End date is required";
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (start >= end) {
        errors.endDate = "End date must be after start date";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !id) {
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(
        updateProject({
          id,
          updates: {
            ...formData,
            title: formData.title.trim(),
            description: formData.description.trim(),
            startDate: new Date(formData.startDate).toISOString(),
            endDate: new Date(formData.endDate).toISOString(),
          },
        })
      ).unwrap();
      if (user)
        await logActivity(
          user.id,
          user.name,
          "Updated project",
          "project",
          id,
          formData.title.trim()
        );
      toast.success("Project updated successfully!");
      navigate(`/projects/${id}`);
    } catch (_error) {
      toast.error("Failed to update project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  if (status === RequestStatus.LOADING) {
    return <LoaderIcon />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/projects")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/projects")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Project not found
          </h3>
          <p className="text-gray-600">
            The project you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/projects/${id}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Project
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Project</h1>
          <p className="text-muted-foreground">Update project information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Project Information
              </CardTitle>
              <CardDescription>
                Update basic details about your project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter project title"
                  value={formData.title}
                  maxLength={100}
                  onChange={(e) => handleChange("title", e.target.value)}
                  className={formErrors.title ? "border-red-500" : ""}
                />
                {formErrors.title && (
                  <p className="text-sm text-red-600">{formErrors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your project..."
                  rows={4}
                  maxLength={1000}
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className={formErrors.description ? "border-red-500" : ""}
                />
                {formErrors.description && (
                  <p className="text-sm text-red-600">
                    {formErrors.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleChange("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ProjectStatus.NOT_STARTED}>
                        Not Started
                      </SelectItem>
                      <SelectItem value={ProjectStatus.IN_PROGRESS}>
                        In Progress
                      </SelectItem>
                      <SelectItem value={ProjectStatus.COMPLETED}>
                        Completed
                      </SelectItem>
                      <SelectItem value={ProjectStatus.ON_HOLD}>
                        On Hold
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => handleChange("priority", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline & Management
              </CardTitle>
              <CardDescription>
                Update project dates and view manager information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleChange("startDate", e.target.value)}
                    className={formErrors.startDate ? "border-red-500" : ""}
                  />
                  {formErrors.startDate && (
                    <p className="text-sm text-red-600">
                      {formErrors.startDate}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleChange("endDate", e.target.value)}
                    className={formErrors.endDate ? "border-red-500" : ""}
                  />
                  {formErrors.endDate && (
                    <p className="text-sm text-red-600">{formErrors.endDate}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Project Manager
                  </h4>
                  <div className="text-sm text-muted-foreground">
                    <p>
                      <strong>Name:</strong> {currentProject.managerName}
                    </p>
                    <p>
                      <strong>ID:</strong> {currentProject.managerId}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-neutral-800  rounded-lg">
                  <h4 className="font-medium mb-2">Project Information</h4>
                  <div className="text-sm text-muted-foreground">
                    <p>
                      <strong>Project ID:</strong> {currentProject.id}
                    </p>
                    <p>
                      <strong>Created:</strong>{" "}
                      {new Date(currentProject.createdAt).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Members:</strong>{" "}
                      {currentProject.members?.length || 0}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/projects/${id}`)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Update Project
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditProjectPage;
