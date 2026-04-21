import { useState, useEffect, type ChangeEvent } from "react";
import { useNavigate, Navigate } from "react-router";
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
  Plus,
  UserPlus,
} from "lucide-react";
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

const CreateProjectPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((state) => state.projects);
  const { user } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: ProjectStatus.NOT_STARTED as ProjectStatus,
    priority: Priority.MEDIUM as Priority,
    startDate: "",
    managerId: "",
    managerName: "",
    members: [],
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [availableManagers, setAvailableManagers] = useState<User[]>([]);
  const [availableMembers, setAvailableMembers] = useState<User[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await firebaseFetch<Record<string, Omit<User, "id">> | null>(
        "users.json"
      );

      if (data) {
        const users: User[] = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));

        setAvailableManagers(users.filter((u) => u.role === Role.MANAGER));
        setAvailableMembers(users.filter((u) => u.role === Role.MEMBER));
      }
    } catch (_error) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (!user || !Permissions.canCreateProjects(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

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

    if (!formData.managerId) {
      errors.managerId = "Project manager is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

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

    const projectData = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
      managerName: selectedManager?.name || "",
      members: projectMembers,
      endDate: "",
      createdBy: user?.id || "",
      createdByName: user?.name || "",
    };

    try {
      await dispatch(createProject(projectData)).unwrap();
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
    } catch (_error) {
      toast.error("Failed to create project");
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (formErrors[field]) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }

    if (field === "managerId") {
      const selectedManager = availableManagers.find((m) => m.id === value);
      if (selectedManager) {
        setFormData((prev) => ({
          ...prev,
          managerName: selectedManager.name,
        }));
      }
    }
  };

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

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
        <div>
          <h1 className="text-3xl font-bold">Create New Project</h1>
          <p className="text-muted-foreground">
            Create and assign a new project (Admin Only)
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-red-800 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Project Information
              </CardTitle>
              <CardDescription>
                Basic details about your project
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
                  onChange={(event) =>
                    handleChange("title", event.target.value)
                  }
                  className={formErrors.title ? "border-red-800" : ""}
                />
                {formErrors.title && (
                  <p className="text-sm text-red-800">{formErrors.title}</p>
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
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                    handleChange("description", event.target.value)
                  }
                  className={formErrors.description ? "border-red-800" : ""}
                />
                {formErrors.description && (
                  <p className="text-sm text-red-800">
                    {formErrors.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Initial Status</Label>
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
                Assignment & Timeline
              </CardTitle>
              <CardDescription>
                Assign project manager and set start date
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(event) =>
                    handleChange("startDate", event.target.value)
                  }
                  min={new Date().toISOString().split("T")[0]}
                  className={formErrors.startDate ? "border-red-800" : ""}
                />
                {formErrors.startDate && (
                  <p className="text-sm text-red-800">{formErrors.startDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="managerId">Project Manager *</Label>
                <Select
                  value={formData.managerId}
                  onValueChange={(value) => handleChange("managerId", value)}
                  disabled={availableManagers.length === 0}
                >
                  <SelectTrigger
                    className={formErrors.managerId ? "border-red-800" : ""}
                  >
                    <SelectValue
                      placeholder={
                        availableManagers.length === 0
                          ? "No managers available — assign Manager role first"
                          : "Select a project manager"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableManagers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{manager.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {manager.email}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableManagers.length === 0 && !loading && (
                  <p className="text-sm text-amber-600">
                    No users with Manager role found. Go to User Management to
                    assign the Manager role to a user first.
                  </p>
                )}
                {formErrors.managerId && (
                  <p className="text-sm text-red-800">{formErrors.managerId}</p>
                )}
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-neutral-200">
                  <strong>Note:</strong> The project manager will be responsible
                  for setting the end date and managing the project timeline
                  after creation.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Team Members
            </CardTitle>
            <CardDescription>
              Select team members to assign to this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <LoaderIcon />
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableMembers.map((member) => (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-900 ${
                      selectedMembers.includes(member.id)
                        ? "bg-blue-50 dark:bg-slate-800 border-blue-300 dark:border-blue-500"
                        : ""
                    }`}
                    onClick={() => handleMemberToggle(member.id)}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(member.id)}
                        onChange={() => handleMemberToggle(member.id)}
                        className="w-4 h-4"
                      />
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.email}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded dark:bg-neutral-600">
                      {member.role}
                    </span>
                  </div>
                ))}
                {availableMembers.length === 0 && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    No members available.
                  </div>
                )}
              </div>
            )}
            <div className="mt-4 text-sm text-muted-foreground">
              Selected: {selectedMembers.length} members
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/projects")}
            disabled={status === RequestStatus.LOADING}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={status === RequestStatus.LOADING}>
            {status === RequestStatus.LOADING ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
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
