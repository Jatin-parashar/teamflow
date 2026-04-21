import { useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Users,
  Calendar,
  AlertCircle,
  Clock,
  Shield,
  Briefcase,
  UserPlus,
  CheckCircle,
  XCircle,
  PauseCircle,
  Target,
  TrendingUp,
  Activity,
} from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import {
  deleteProject,
  fetchProjects,
  type Project,
} from "@/features/projectSlice";
import LoaderIcon from "@/components/ui/loader";
import { Priority, ProjectStatus, RequestStatus, Role, Permissions, hasMinRole } from "@/features/types";
import ProjectStatusIcon from "@/components/ProjectStatusIcon";
import { getPriorityColor, getProjectStatusColor, getRoleBadgeStyle } from "@/utils/roleUtilities";

interface ProjectStats {
  total: number;
  notStarted: number;
  inProgress: number;
  completed: number;
  onHold: number;
  highPriority: number;
  overdue: number;
}

const ProjectsPage = () => {
  const dispatch = useAppDispatch();
  const { projects, status, error } = useAppSelector((state) => state.projects);
  const { user } = useAppSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const getFilteredProjectsByRole = (): Project[] => {
    if (!user) return [];
    if (hasMinRole(user.role, Role.ADMIN)) return projects;
    if (hasMinRole(user.role, Role.MANAGER)) {
      return projects.filter(
        (project) =>
          project.managerId === user.id ||
          project.members?.some((member) => member.userId === user.id)
      );
    }
    return projects.filter((project) =>
      project.members?.some((member) => member.userId === user.id)
    );
  };

  const roleBasedProjects = getFilteredProjectsByRole();

  const filteredProjects = roleBasedProjects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.managerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || project.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getProjectStats = (): ProjectStats => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      total: roleBasedProjects.length,
      notStarted: roleBasedProjects.filter(
        (p) => p.status === ProjectStatus.NOT_STARTED
      ).length,
      inProgress: roleBasedProjects.filter(
        (p) => p.status === ProjectStatus.IN_PROGRESS
      ).length,
      completed: roleBasedProjects.filter(
        (p) => p.status === ProjectStatus.COMPLETED
      ).length,
      onHold: roleBasedProjects.filter(
        (p) => p.status === ProjectStatus.ON_HOLD
      ).length,
      highPriority: roleBasedProjects.filter(
        (p) => p.priority === Priority.HIGH || p.priority === Priority.CRITICAL
      ).length,
      overdue: roleBasedProjects.filter((p) => {
        if (p.endDate && p.status !== ProjectStatus.COMPLETED) {
          const endDate = new Date(p.endDate);
          return endDate < today;
        }
        return false;
      }).length,
    };
  };

  const stats = getProjectStats();

  const handleDeleteProject = async (projectId: string) => {
    try {
      await dispatch(deleteProject(projectId)).unwrap();
      toast.success("Project deleted successfully");
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    } catch (error) {
      toast.error("Failed to delete project");
    }
  };

  const canCreateProjects = user ? Permissions.canCreateProjects(user.role) : false;
  const canDeleteProjects = user ? Permissions.canDeleteProjects(user.role) : false;
  const canEditProject = (project: Project) => {
    if (!user) return false;
    return Permissions.canEditProject(user.role) || project.managerId === user.id;
  };

  const getUserProjectRole = (project: Project) => {
    if (!user) return null;
    if (hasMinRole(user.role, Role.ADMIN)) return user.role;
    if (project.managerId === user.id) return Role.MANAGER;
    if (project.members?.some((member) => member.userId === user.id)) return Role.MEMBER;
    return null;
  };

  const isProjectOverdue = (project: Project) => {
    if (!project.endDate || project.status === ProjectStatus.COMPLETED)
      return false;
    const today = new Date();
    const endDate = new Date(project.endDate);
    return endDate < today;
  };

  const getTimeRemaining = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "1 day remaining";
    return `${diffDays} days remaining`;
  };

  if (status === RequestStatus.LOADING) {
    return <LoaderIcon />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            Projects
          </h1>
          <p className="text-muted-foreground">
            Manage and track your projects
          </p>
        </div>
        {canCreateProjects && (
          <Button
            asChild
          >
            <Link to="/projects/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="border-blue-200 bg-blue-50 dark:bg-neutral-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total</p>
                <p className="text-2xl font-bold text-blue-800">
                  {stats.total}
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gray-50 dark:bg-neutral-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium dark:text-gray-400">
                  Not Started
                </p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-400">
                  {stats.notStarted}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-gray-600 dark:text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50 dark:bg-neutral-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">In Progress</p>
                <p className="text-2xl font-bold text-blue-800">
                  {stats.inProgress}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-600 dark:bg-neutral-900" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50 dark:bg-neutral-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Completed</p>
                <p className="text-2xl font-bold text-green-800">
                  {stats.completed}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600 dark:bg-neutral-900" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50 dark:bg-neutral-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">On Hold</p>
                <p className="text-2xl font-bold text-yellow-800">
                  {stats.onHold}
                </p>
              </div>
              <PauseCircle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50 dark:bg-neutral-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">
                  High Priority
                </p>
                <p className="text-2xl font-bold text-orange-800">
                  {stats.highPriority}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50 dark:bg-neutral-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Overdue</p>
                <p className="text-2xl font-bold text-red-800">
                  {stats.overdue}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="p-4 rounded-lg border bg-muted/50">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            You have {user?.role} access
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects by title, description, or manager..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value={ProjectStatus.NOT_STARTED}>
              Not Started
            </SelectItem>
            <SelectItem value={ProjectStatus.IN_PROGRESS}>
              In Progress
            </SelectItem>
            <SelectItem value={ProjectStatus.COMPLETED}>Completed</SelectItem>
            <SelectItem value={ProjectStatus.ON_HOLD}>On Hold</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value={Priority.LOW}>Low</SelectItem>
            <SelectItem value={Priority.MEDIUM}>Medium</SelectItem>
            <SelectItem value={Priority.HIGH}>High</SelectItem>
            <SelectItem value={Priority.CRITICAL}>Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Users className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-slate-100">
            No projects found
          </h3>
          <p className="text-gray-600 mb-4 dark:text-slate-200">
            {user?.role === Role.ADMIN && searchTerm
              ? "Try adjusting your search filters"
              : Permissions.canCreateProjects(user?.role || Role.GUEST)
              ? "Get started by creating your first project"
              : "No projects have been assigned to you yet"}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => {
            const userRole = getUserProjectRole(project);
            const isOverdue = isProjectOverdue(project);

            return (
              <Card
                key={project.id}
                className={`hover:shadow-lg transition-shadow`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span className="truncate">{project.title}</span>
                        {userRole && (
                          <Badge variant="outline" className={`text-xs ${getRoleBadgeStyle(userRole)}`}>
                            {userRole}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        {project.id}
                      </CardDescription>
                      {isOverdue && (
                        <div className="flex items-center gap-1 text-red-600 text-sm">
                          <AlertCircle className="h-3 w-3" />
                          <span className="font-medium">Overdue</span>
                        </div>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/projects/${project.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        {canEditProject(project) && (
                          <DropdownMenuItem asChild>
                            <Link to={`/projects/${project.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {user && Permissions.canManageMembers(user.role) && (
                          <DropdownMenuItem asChild>
                            <Link to={`/projects/${project.id}/manage-members`}>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Manage Members
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {canDeleteProjects && (
                          <DropdownMenuItem
                            onClick={() => {
                              setProjectToDelete(project.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 flex flex-col">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <Badge
                      className={`${getProjectStatusColor(
                        project.status
                      )} flex items-center gap-1`}
                    >
                      <ProjectStatusIcon projectStatus={project.status} />
                      {project.status}
                    </Badge>
                    <Badge className={getPriorityColor(project.priority)}>
                      {project.priority}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      <span className="truncate">
                        Manager: {project.managerName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{project.members?.length || 0} members</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Started:{" "}
                        {new Date(project.startDate).toLocaleDateString()}
                      </span>
                    </div>
                    {project.endDate && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span
                          className={
                            isOverdue ? "text-red-600 font-medium" : ""
                          }
                        >
                          {getTimeRemaining(project.endDate)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                      <span>Status</span>
                      <span className="ml-auto">
                        {project.status === ProjectStatus.COMPLETED
                          ? "Completed"
                          : project.status === ProjectStatus.IN_PROGRESS
                          ? "In Progress"
                          : project.status === ProjectStatus.ON_HOLD
                          ? "On Hold"
                          : "Not Started"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              project and all associated tasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                projectToDelete && handleDeleteProject(projectToDelete)
              }
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectsPage;
