import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Link } from "react-router";
import { toast } from "sonner";
import {
  deleteProject,
  fetchProjects,
  type Project,
} from "@/features/projectSlice";
import LoaderIcon from "@/components/ui/loader";
import {
  Priority,
  ProjectStatus,
  RequestStatus,
  Role,
  Permissions,
  hasMinRole,
} from "@/features/types";
import ProjectStatusIcon from "@/components/ProjectStatusIcon";
import {
  getPriorityColor,
  getProjectStatusColor,
  getRoleBadgeStyle,
} from "@/utils/roleUtilities";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
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
  CheckCircle2,
  XCircle,
  PauseCircle,
  Target,
  TrendingUp,
  Activity,
  TriangleAlert,
} from "lucide-react";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const ProjectsPage = () => {
  const dispatch = useAppDispatch();
  const { projects, status, error } = useAppSelector((s) => s.projects);
  const { user } = useAppSelector((s) => s.auth);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const getFilteredByRole = (): Project[] => {
    if (!user) return [];
    if (hasMinRole(user.role, Role.ADMIN)) return projects;
    if (hasMinRole(user.role, Role.MANAGER))
      return projects.filter(
        (p) =>
          p.managerId === user.id ||
          p.members?.some((m) => m.userId === user.id)
      );
    return projects.filter((p) => p.members?.some((m) => m.userId === user.id));
  };

  const roleBasedProjects = getFilteredByRole();
  const filteredProjects = roleBasedProjects.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.managerName.toLowerCase().includes(searchTerm.toLowerCase());
    return (
      matchSearch &&
      (statusFilter === "all" || p.status === statusFilter) &&
      (priorityFilter === "all" || p.priority === priorityFilter)
    );
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const stats = {
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
    onHold: roleBasedProjects.filter((p) => p.status === ProjectStatus.ON_HOLD)
      .length,
    highPriority: roleBasedProjects.filter(
      (p) => p.priority === Priority.HIGH || p.priority === Priority.CRITICAL
    ).length,
    overdue: roleBasedProjects.filter(
      (p) =>
        p.endDate &&
        p.status !== ProjectStatus.COMPLETED &&
        new Date(p.endDate) < today
    ).length,
  };

  const handleDelete = async (projectId: string) => {
    try {
      await dispatch(deleteProject(projectId)).unwrap();
      toast.success("Project deleted successfully");
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    } catch {
      toast.error("Failed to delete project");
    }
  };

  const canCreate = user ? Permissions.canCreateProjects(user.role) : false;
  const canDelete = user ? Permissions.canDeleteProjects(user.role) : false;
  const canEdit = (p: Project) =>
    user
      ? Permissions.canEditProject(user.role) || p.managerId === user.id
      : false;
  const getUserRole = (p: Project) => {
    if (!user) return null;
    if (hasMinRole(user.role, Role.ADMIN)) return user.role;
    if (p.managerId === user.id) return Role.MANAGER;
    if (p.members?.some((m) => m.userId === user.id)) return Role.MEMBER;
    return null;
  };
  const isOverdue = (p: Project) =>
    !!(
      p.endDate &&
      p.status !== ProjectStatus.COMPLETED &&
      new Date(p.endDate) < today
    );
  const getTimeRemaining = (endDate: string) => {
    const diff = Math.ceil(
      (new Date(endDate).getTime() - Date.now()) / MS_PER_DAY
    );
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    if (diff === 0) return "Due today";
    return `${diff}d left`;
  };

  if (status === RequestStatus.LOADING) return <LoaderIcon />;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <PageHeader
          title="Projects"
          description="Manage and track your projects"
          actions={
            canCreate ? (
              <Button asChild size="sm">
                <Link to="/projects/create">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Create Project
                </Link>
              </Button>
            ) : undefined
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatCard
            label="Total"
            value={stats.total}
            icon={Target}
            iconClass="text-primary"
            valueClass="text-foreground"
          />
          <StatCard
            label="Not Started"
            value={stats.notStarted}
            icon={XCircle}
            iconClass="text-muted-foreground"
            valueClass="text-muted-foreground"
          />
          <StatCard
            label="In Progress"
            value={stats.inProgress}
            icon={Activity}
            iconClass="text-blue-500"
            valueClass="text-blue-600"
          />
          <StatCard
            label="Completed"
            value={stats.completed}
            icon={CheckCircle2}
            iconClass="text-emerald-500"
            valueClass="text-emerald-600"
          />
          <StatCard
            label="On Hold"
            value={stats.onHold}
            icon={PauseCircle}
            iconClass="text-amber-500"
            valueClass="text-amber-600"
          />
          <StatCard
            label="High Priority"
            value={stats.highPriority}
            icon={TrendingUp}
            iconClass="text-orange-500"
            valueClass="text-orange-600"
          />
          <StatCard
            label="Overdue"
            value={stats.overdue}
            icon={AlertCircle}
            iconClass="text-destructive"
            valueClass="text-destructive"
          />
        </div>

        {/* Role badge */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/50 w-fit">
          <Shield className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Viewing as{" "}
            <span className="font-medium text-foreground">{user?.role}</span>
          </span>
        </div>

        {error && (
          <Alert variant="destructive">
            <TriangleAlert className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 bg-background"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 h-9 bg-background">
              <SelectValue placeholder="All Status" />
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
            <SelectTrigger className="w-full sm:w-44 h-9 bg-background">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value={Priority.LOW}>Low</SelectItem>
              <SelectItem value={Priority.MEDIUM}>Medium</SelectItem>
              <SelectItem value={Priority.HIGH}>High</SelectItem>
              <SelectItem value={Priority.CRITICAL}>Critical</SelectItem>
            </SelectContent>
          </Select>
          {(searchTerm ||
            statusFilter !== "all" ||
            priorityFilter !== "all") && (
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setPriorityFilter("all");
              }}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Grid */}
        {filteredProjects.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No projects found"
            description={
              searchTerm
                ? "Try adjusting your search filters"
                : canCreate
                  ? "Get started by creating your first project"
                  : "No projects have been assigned to you yet"
            }
            action={
              canCreate && !searchTerm ? (
                <Button asChild size="sm">
                  <Link to="/projects/create">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Create Project
                  </Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => {
              const userRole = getUserRole(project);
              const overdue = isOverdue(project);
              return (
                <Card
                  key={project.id}
                  className={`border bg-card hover:shadow-md transition-all duration-150 ${overdue ? "border-destructive/40" : "border-border"}`}
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <p className="font-semibold text-sm text-foreground truncate cursor-default hover:text-primary transition-colors">
                                {project.title}
                              </p>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-64" side="top">
                              <p className="text-xs text-muted-foreground line-clamp-4">
                                {project.description}
                              </p>
                            </HoverCardContent>
                          </HoverCard>
                          {userRole && (
                            <Badge
                              variant="outline"
                              className={`text-xs ${getRoleBadgeStyle(userRole)}`}
                            >
                              {userRole}
                            </Badge>
                          )}
                        </div>
                        {overdue && (
                          <div className="flex items-center gap-1 text-destructive text-xs mt-0.5">
                            <AlertCircle className="h-3 w-3" />
                            <span className="font-medium">Overdue</span>
                          </div>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem asChild>
                            <Link to={`/projects/${project.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {canEdit(project) && (
                            <DropdownMenuItem asChild>
                              <Link to={`/projects/${project.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {user && Permissions.canManageMembers(user.role) && (
                            <DropdownMenuItem asChild>
                              <Link
                                to={`/projects/${project.id}/manage-members`}
                              >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Manage Members
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                onClick={() => {
                                  setProjectToDelete(project.id);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5">
                      <Badge
                        variant="outline"
                        className={`${getProjectStatusColor(project.status)} text-xs flex items-center gap-1`}
                      >
                        <ProjectStatusIcon projectStatus={project.status} />
                        {project.status}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`${getPriorityColor(project.priority)} text-xs`}
                      >
                        {project.priority}
                      </Badge>
                    </div>

                    <Separator />

                    {/* Meta */}
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {project.managerName || "Unassigned"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 shrink-0" />
                        <span>{project.members?.length ?? 0} members</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {new Date(project.startDate).toLocaleDateString()}
                        </span>
                      </div>
                      {project.endDate && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          <span
                            className={
                              overdue ? "text-destructive font-medium" : ""
                            }
                          >
                            {getTimeRemaining(project.endDate)}
                          </span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-7 text-xs"
                      asChild
                    >
                      <Link to={`/projects/${project.id}`}>
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        View Details
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Project</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this project? It will be moved
                to trash and can be restored later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => projectToDelete && handleDelete(projectToDelete)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Project
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
};

export default ProjectsPage;
