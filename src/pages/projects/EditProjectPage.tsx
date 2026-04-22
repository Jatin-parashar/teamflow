import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { fetchProjectById, updateProject } from "@/features/projectSlice";
import { logActivity } from "@/firebase/activityLog";
import {
  Priority,
  ProjectStatus,
  RequestStatus,
  type ProjectStatus as PS,
} from "@/features/types";
import LoaderIcon from "@/components/ui/loader";
import PageHeader from "@/components/PageHeader";
import FormField from "@/components/FormField";
import { sanitize } from "@/utils/sanitize";
import {
  FileText,
  Calendar,
  Users,
  Save,
  Loader2,
  TriangleAlert,
} from "lucide-react";

const EditProjectPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentProject, status, error } = useAppSelector((s) => s.projects);
  const { user } = useAppSelector((s) => s.auth);

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
    if (id) dispatch(fetchProjectById(id));
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

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.title.trim()) e.title = "Project title is required";
    else if (formData.title.trim().length > 100) e.title = "Max 100 characters";
    if (!formData.description.trim()) e.description = "Description is required";
    else if (formData.description.trim().length > 1000)
      e.description = "Max 1000 characters";
    if (!formData.startDate) e.startDate = "Start date is required";
    if (!formData.endDate) e.endDate = "End date is required";
    if (
      formData.startDate &&
      formData.endDate &&
      new Date(formData.startDate) >= new Date(formData.endDate)
    )
      e.endDate = "End date must be after start date";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !id) return;
    setIsSubmitting(true);
    try {
      await dispatch(
        updateProject({
          id,
          updates: {
            ...formData,
            title: sanitize(formData.title.trim()),
            description: sanitize(formData.description.trim()),
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
    } catch {
      toast.error("Failed to update project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: "" }));
  };

  if (status === RequestStatus.LOADING) return <LoaderIcon />;

  if (error || !currentProject)
    return (
      <div className="space-y-6">
        <PageHeader
          title="Edit Project"
          backTo="/projects"
          backLabel="Back to Projects"
        />
        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" />
          <AlertDescription>{error || "Project not found."}</AlertDescription>
        </Alert>
      </div>
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Project"
        description="Update project information"
        backTo={`/projects/${id}`}
        backLabel="Back to Project"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Project Info */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Project Information
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 space-y-4">
              <FormField
                id="title"
                label="Project Title"
                required
                error={formErrors.title}
              >
                <Input
                  id="title"
                  placeholder="Enter project title"
                  value={formData.title}
                  maxLength={100}
                  onChange={(e) => handleChange("title", e.target.value)}
                  className={`h-9 bg-background ${formErrors.title ? "border-destructive" : ""}`}
                />
              </FormField>
              <FormField
                id="description"
                label="Description"
                required
                error={formErrors.description}
              >
                <Textarea
                  id="description"
                  placeholder="Describe your project..."
                  rows={4}
                  maxLength={1000}
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className={`bg-background resize-none ${formErrors.description ? "border-destructive" : ""}`}
                />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField id="status" label="Status">
                  <Select
                    value={formData.status}
                    onValueChange={(v) => handleChange("status", v)}
                  >
                    <SelectTrigger className="h-9 bg-background">
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
                </FormField>
                <FormField id="priority" label="Priority">
                  <Select
                    value={formData.priority}
                    onValueChange={(v) => handleChange("priority", v)}
                  >
                    <SelectTrigger className="h-9 bg-background">
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
                </FormField>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Timeline & Management
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  id="startDate"
                  label="Start Date"
                  required
                  error={formErrors.startDate}
                >
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleChange("startDate", e.target.value)}
                    className={`h-9 bg-background ${formErrors.startDate ? "border-destructive" : ""}`}
                  />
                </FormField>
                <FormField
                  id="endDate"
                  label="End Date"
                  required
                  error={formErrors.endDate}
                >
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleChange("endDate", e.target.value)}
                    className={`h-9 bg-background ${formErrors.endDate ? "border-destructive" : ""}`}
                  />
                </FormField>
              </div>

              <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
                <p className="text-xs font-medium text-foreground flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" />
                  Project Manager
                </p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium text-foreground">Name: </span>
                    {currentProject.managerName}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">
                      Members:{" "}
                    </span>
                    {currentProject.members?.length ?? 0}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-1">
                <p className="text-xs font-medium text-foreground">
                  Project Info
                </p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    <span className="font-medium text-foreground">ID: </span>
                    {currentProject.id}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">
                      Created:{" "}
                    </span>
                    {new Date(currentProject.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate(`/projects/${id}`)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1.5" />
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
