import { useState, useEffect, type ChangeEvent } from "react";
import { useNavigate, Navigate } from "react-router";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createProject } from "@/features/projectSlice";
import { firebaseFetch } from "@/firebase/firebaseFetch";
import { logActivity } from "@/firebase/activityLog";
import {
  Priority,
  ProjectStatus,
  RequestStatus,
  Role,
  Permissions,
  type User,
} from "@/features/types";
import LoaderIcon from "@/components/ui/loader";
import PageHeader from "@/components/PageHeader";
import FormField from "@/components/FormField";
import {
  FileText,
  Calendar,
  UserPlus,
  Loader2,
  Plus,
  TriangleAlert,
} from "lucide-react";

const CreateProjectPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((s) => s.projects);
  const { user } = useAppSelector((s) => s.auth);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: ProjectStatus.NOT_STARTED as ProjectStatus,
    priority: Priority.MEDIUM as Priority,
    startDate: "",
    managerId: "",
    managerName: "",
    members: [] as any[],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [availableManagers, setAvailableManagers] = useState<User[]>([]);
  const [availableMembers, setAvailableMembers] = useState<User[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const data = await firebaseFetch<Record<
          string,
          Omit<User, "id">
        > | null>("users.json");
        if (data) {
          const users: User[] = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          setAvailableManagers(users.filter((u) => u.role === Role.MANAGER));
          setAvailableMembers(users.filter((u) => u.role === Role.MEMBER));
        }
      } catch {
        toast.error("Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (!user || !Permissions.canCreateProjects(user.role))
    return <Navigate to="/unauthorized" replace />;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.title.trim()) e.title = "Project title is required";
    else if (formData.title.trim().length > 100) e.title = "Max 100 characters";
    if (!formData.description.trim()) e.description = "Description is required";
    else if (formData.description.trim().length > 1000)
      e.description = "Max 1000 characters";
    if (!formData.startDate) e.startDate = "Start date is required";
    if (!formData.managerId) e.managerId = "Project manager is required";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    const selectedManager = availableManagers.find(
      (m) => m.id === formData.managerId
    );
    const projectMembers = selectedMembers.map((memberId) => {
      const member = availableMembers.find((m) => m.id === memberId);
      return {
        userId: memberId,
        name: member?.name || "",
        email: member?.email || "",
        role: member?.role || Role.MEMBER,
        joinedAt: new Date().toISOString(),
      };
    });
    try {
      await dispatch(
        createProject({
          ...formData,
          title: formData.title.trim(),
          description: formData.description.trim(),
          managerName: selectedManager?.name || "",
          members: projectMembers,
          endDate: "",
          createdBy: user?.id || "",
          createdByName: user?.name || "",
        })
      ).unwrap();
      await logActivity(
        user.id,
        user.name,
        "Created project",
        "project",
        formData.title,
        formData.title.trim()
      );
      toast.success("Project created successfully!");
      navigate("/projects");
    } catch {
      toast.error("Failed to create project");
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: "" }));
    if (field === "managerId") {
      const mgr = availableManagers.find((m) => m.id === value);
      if (mgr) setFormData((prev) => ({ ...prev, managerName: mgr.name }));
    }
  };

  const toggleMember = (memberId: string) =>
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create New Project"
        description="Create and assign a new project"
        backTo="/projects"
        backLabel="Back to Projects"
      />

      {error && (
        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    handleChange("description", e.target.value)
                  }
                  className={`bg-background resize-none ${formErrors.description ? "border-destructive" : ""}`}
                />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField id="status" label="Initial Status">
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

          {/* Assignment & Timeline */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Assignment & Timeline
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 space-y-4">
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
                  min={new Date().toISOString().split("T")[0]}
                  className={`h-9 bg-background ${formErrors.startDate ? "border-destructive" : ""}`}
                />
              </FormField>
              <FormField
                id="managerId"
                label="Project Manager"
                required
                error={formErrors.managerId}
              >
                <Select
                  value={formData.managerId}
                  onValueChange={(v) => handleChange("managerId", v)}
                  disabled={availableManagers.length === 0}
                >
                  <SelectTrigger
                    className={`h-9 bg-background ${formErrors.managerId ? "border-destructive" : ""}`}
                  >
                    <SelectValue
                      placeholder={
                        availableManagers.length === 0
                          ? "No managers available"
                          : "Select a project manager"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableManagers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        <span>{m.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {m.email}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableManagers.length === 0 && !loading && (
                  <p className="text-xs text-amber-600 mt-1">
                    No users with Manager role. Go to User Management to assign
                    the Manager role first.
                  </p>
                )}
              </FormField>
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">
                  The project manager will be responsible for setting the end
                  date and managing the project timeline after creation.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Members */}
        <Card className="border border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-muted-foreground" />
                Team Members
              </CardTitle>
              {selectedMembers.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectedMembers.length} selected
                </Badge>
              )}
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            {loading ? (
              <LoaderIcon />
            ) : (
              <ScrollArea className="h-56">
                <div className="space-y-2 pr-3">
                  {availableMembers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      No members available to assign.
                    </p>
                  ) : (
                    availableMembers.map((member) => (
                      <div
                        key={member.id}
                        onClick={() => toggleMember(member.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedMembers.includes(member.id)
                            ? "border-primary/50 bg-primary/5"
                            : "border-border bg-background hover:bg-accent/40"
                        }`}
                      >
                        <Checkbox
                          checked={selectedMembers.includes(member.id)}
                          onCheckedChange={() => toggleMember(member.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {member.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {member.email}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {member.role}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate("/projects")}
            disabled={status === RequestStatus.LOADING}
          >
            Cancel
          </Button>
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
                Create Project
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateProjectPage;
