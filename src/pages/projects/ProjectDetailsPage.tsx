import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Edit,
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  Shield,
  Loader2,
  TriangleAlert,
  ListTodo,
  Clock,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { fetchProjectById, deleteProject } from "@/features/projectSlice";
import { fetchTasksByProject } from "@/features/taskSlice";
import { logActivity } from "@/firebase/activityLog";
import {
  getPriorityColor,
  getProjectStatusColor,
  getTaskStatusColor,
  formatDate,
} from "@/utils/roleUtilities";
import { RequestStatus, Permissions, TaskStatus } from "@/features/types";
import RoleIcon from "@/components/RoleIcon";
import ProjectStatusIcon from "@/components/ProjectStatusIcon";
import LoaderIcon from "@/components/ui/loader";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";

const ProjectDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {
    currentProject,
    status: projectStatus,
    error,
  } = useAppSelector((s) => s.projects);
  const { tasks, status: taskStatus } = useAppSelector((s) => s.tasks);
  const { user } = useAppSelector((s) => s.auth);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchProjectById(id));
      dispatch(fetchTasksByProject(id));
    }
  }, [dispatch, id]);

  const handleDelete = async () => {
    if (!currentProject) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteProject(currentProject.id)).unwrap();
      if (user)
        await logActivity(
          user.id,
          user.name,
          "Deleted project",
          "project",
          currentProject.id,
          currentProject.title
        );
      toast.success("Project deleted successfully");
      navigate("/projects");
    } catch {
      toast.error("Failed to delete project");
    } finally {
      setIsDeleting(false);
    }
  };

  const progress =
    tasks.length > 0
      ? Math.round(
          (tasks.filter((t) => t.status === TaskStatus.DONE).length /
            tasks.length) *
            100
        )
      : 0;

  const canEdit = user
    ? Permissions.canEditProject(user.role) ||
      currentProject?.managerId === user?.id
    : false;
  const canDeleteProject = user
    ? Permissions.canDeleteProjects(user.role)
    : false;
  const canCreateTask = user ? Permissions.canCreateTasks(user.role) : false;

  const taskStats = {
    total: tasks.length,
    done: tasks.filter((t) => t.status === TaskStatus.DONE).length,
    inProgress: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
    blocked: tasks.filter((t) => t.status === TaskStatus.BLOCKED).length,
    todo: tasks.filter((t) => t.status === TaskStatus.TO_DO).length,
  };

  if (projectStatus === RequestStatus.LOADING) return <LoaderIcon />;

  if (error || !currentProject) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Project Details"
          backTo="/projects"
          backLabel="Back to Projects"
        />
        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" />
          <AlertDescription>{error || "Project not found."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={currentProject.title}
        description="Project Details"
        backTo="/projects"
        backLabel="Back to Projects"
        actions={
          <>
            {canCreateTask && (
              <Button size="sm" asChild>
                <Link to={`/tasks/create?projectId=${currentProject.id}`}>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Task
                </Link>
              </Button>
            )}
            {canEdit && (
              <Button variant="outline" size="sm" asChild>
                <Link to={`/projects/${currentProject.id}/edit`}>
                  <Edit className="h-4 w-4 mr-1.5" />
                  Edit
                </Link>
              </Button>
            )}
            {canDeleteProject && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isDeleting}>
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-1.5" />
                    )}
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Project</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{currentProject.title}"?
                      This will permanently delete the project and all
                      associated tasks.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Project
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </>
        }
      />

      {/* Task Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total Tasks"
          value={taskStats.total}
          icon={ListTodo}
          iconClass="text-muted-foreground"
          valueClass="text-foreground"
        />
        <StatCard
          label="Done"
          value={taskStats.done}
          icon={CheckCircle2}
          iconClass="text-emerald-500"
          valueClass="text-emerald-600"
        />
        <StatCard
          label="In Progress"
          value={taskStats.inProgress}
          icon={Clock}
          iconClass="text-blue-500"
          valueClass="text-blue-600"
        />
        <StatCard
          label="Blocked"
          value={taskStats.blocked}
          icon={XCircle}
          iconClass="text-destructive"
          valueClass="text-destructive"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="lg:col-span-2 space-y-4">
          {/* Overview */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Project Overview</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentProject.description}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Status</p>
                  <Badge
                    variant="outline"
                    className={`${getProjectStatusColor(currentProject.status)} flex items-center gap-1 w-fit text-xs`}
                  >
                    <ProjectStatusIcon projectStatus={currentProject.status} />
                    {currentProject.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">
                    Priority
                  </p>
                  <Badge
                    variant="outline"
                    className={`${getPriorityColor(currentProject.priority)} text-xs`}
                  >
                    {currentProject.priority}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Start Date
                  </p>
                  <p className="text-sm text-foreground">
                    {formatDate(currentProject.startDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">End Date</p>
                  <p className="text-sm text-foreground">
                    {currentProject.endDate
                      ? formatDate(currentProject.endDate)
                      : "Not set"}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Task Completion</span>
                  <span className="tabular-nums font-medium text-foreground">
                    {progress}%
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Tasks */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  Tasks (
                  {
                    tasks.filter((t) => t.projectId === currentProject.id)
                      .length
                  }
                  )
                </CardTitle>
                {canCreateTask && (
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/tasks/create?projectId=${currentProject.id}`}>
                      <Plus className="h-4 w-4 mr-1.5" />
                      Add Task
                    </Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              {taskStatus === RequestStatus.LOADING ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : tasks.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="No tasks yet"
                  description="Create the first task for this project."
                  action={
                    canCreateTask ? (
                      <Button size="sm" asChild>
                        <Link
                          to={`/tasks/create?projectId=${currentProject.id}`}
                        >
                          <Plus className="h-4 w-4 mr-1.5" />
                          Create Task
                        </Link>
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <ScrollArea className="h-[360px]">
                  <div className="p-4 space-y-2">
                    {tasks
                      .filter((t) => t.projectId === currentProject.id)
                      .map((task) => (
                        <div
                          key={task.id}
                          className="flex items-start justify-between p-3 rounded-lg border border-border bg-background hover:bg-accent/40 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <p className="font-medium text-sm text-foreground">
                                {task.title}
                              </p>
                              <Badge
                                variant="outline"
                                className={`${getTaskStatusColor(task.status)} text-xs`}
                              >
                                {task.status}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`${getPriorityColor(task.priority)} text-xs`}
                              >
                                {task.priority}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {task.description}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span>{task.assignedToName}</span>
                              <span>Due: {formatDate(task.dueDate)}</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs ml-2 shrink-0"
                            asChild
                          >
                            <Link to={`/tasks/${task.id}`}>View</Link>
                          </Button>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Manager */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                Project Manager
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {currentProject.managerName?.charAt(0).toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm text-foreground">
                    {currentProject.managerName || "Unassigned"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Project Manager
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Members */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Team Members ({currentProject.members?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              {!currentProject.members?.length ? (
                <div className="text-center py-4">
                  <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">
                    No team members assigned
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3 pr-2">
                    {currentProject.members.map((member) => (
                      <div
                        key={member.userId}
                        className="flex items-center gap-3"
                      >
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {member.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-foreground truncate">
                              {member.name}
                            </p>
                            <RoleIcon role={member.role} />
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Project Stats</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 space-y-0">
              {[
                {
                  label: "Total Tasks",
                  value: taskStats.total,
                  cls: "text-foreground",
                },
                {
                  label: "Completed",
                  value: taskStats.done,
                  cls: "text-emerald-600",
                },
                {
                  label: "In Progress",
                  value: taskStats.inProgress,
                  cls: "text-blue-600",
                },
                {
                  label: "Blocked",
                  value: taskStats.blocked,
                  cls: "text-destructive",
                },
              ].map(({ label, value, cls }, i, arr) => (
                <div key={label}>
                  <div className="flex justify-between items-center py-2.5">
                    <span className="text-xs text-muted-foreground">
                      {label}
                    </span>
                    <span
                      className={`text-sm font-semibold tabular-nums ${cls}`}
                    >
                      {value}
                    </span>
                  </div>
                  {i < arr.length - 1 && <Separator />}
                </div>
              ))}
              <Separator />
              <div className="flex justify-between items-center py-2.5">
                <span className="text-xs text-muted-foreground">Created</span>
                <span className="text-xs text-foreground">
                  {formatDate(currentProject.createdAt)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center py-2.5">
                <span className="text-xs text-muted-foreground">
                  Last Updated
                </span>
                <span className="text-xs text-foreground">
                  {formatDate(currentProject.updatedAt)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsPage;
