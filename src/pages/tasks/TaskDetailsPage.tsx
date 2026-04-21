import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  fetchTaskById,
  updateTaskStatus,
  deleteTask,
} from "@/features/taskSlice";
import { fetchProjects } from "@/features/projectSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Edit,
  Trash2,
  Calendar,
  User,
  Building,
  Flag,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  TriangleAlert,
  Loader2,
} from "lucide-react";
import {
  RequestStatus,
  Permissions,
  type TaskStatus,
  TaskStatus as TS,
} from "@/features/types";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import LoaderIcon from "@/components/ui/loader";
import TaskStatusIcon from "@/components/TaskStatusIcon";
import { getPriorityColor, getTaskStatusColor } from "@/utils/roleUtilities";
import { logActivity } from "@/firebase/activityLog";
import PageHeader from "@/components/PageHeader";

const TaskDetailsPage = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { currentTask, status, error } = useAppSelector((s) => s.tasks);
  const { projects } = useAppSelector((s) => s.projects);
  const { user } = useAppSelector((s) => s.auth);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchTaskById(id));
      dispatch(fetchProjects());
    }
  }, [dispatch, id]);

  const handleDelete = async () => {
    if (!currentTask) return;
    try {
      await dispatch(deleteTask(currentTask.id)).unwrap();
      if (user)
        await logActivity(
          user.id,
          user.name,
          "Deleted task",
          "task",
          currentTask.id,
          currentTask.title
        );
      toast.success("Task deleted successfully");
      navigate("/tasks");
    } catch {
      toast.error("Failed to delete task");
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!currentTask) return;
    setIsUpdatingStatus(true);
    try {
      await dispatch(
        updateTaskStatus({ taskId: currentTask.id, status: newStatus })
      ).unwrap();
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const canEdit = user ? Permissions.canEditTasks(user.role) : false;
  const canDelete = user ? Permissions.canDeleteTasks(user.role) : false;
  const canUpdateStatus = user
    ? Permissions.canUpdateTaskStatus(user.role) ||
      currentTask?.assignedTo === user?.id
    : false;

  if (status === RequestStatus.LOADING) return <LoaderIcon />;

  if (status === RequestStatus.FAILED || !currentTask) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Task Details"
          backTo="/tasks"
          backLabel="Back to Tasks"
        />
        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" />
          <AlertDescription>
            {error || "Task not found or has been deleted."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const project = projects.find((p) => p.id === currentTask.projectId);
  const dueDate = currentTask.dueDate ? new Date(currentTask.dueDate) : null;
  const daysUntilDue = dueDate ? differenceInDays(dueDate, new Date()) : 0;
  const isOverdue = dueDate ? daysUntilDue < 0 : false;
  const isDueSoon = dueDate ? daysUntilDue <= 3 && daysUntilDue >= 0 : false;

  const statusConfig = {
    [TS.TO_DO]: { icon: <Clock className="h-3.5 w-3.5" />, label: "To Do" },
    [TS.IN_PROGRESS]: {
      icon: <AlertCircle className="h-3.5 w-3.5" />,
      label: "In Progress",
    },
    [TS.DONE]: {
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      label: "Done",
    },
    [TS.BLOCKED]: {
      icon: <XCircle className="h-3.5 w-3.5" />,
      label: "Blocked",
    },
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={currentTask.title}
        description={`Task ID: ${currentTask.id}`}
        backTo="/tasks"
        backLabel="Back to Tasks"
        actions={
          <>
            {canEdit && (
              <Button variant="outline" size="sm" asChild>
                <Link to={`/tasks/${currentTask.id}/edit`}>
                  <Edit className="h-4 w-4 mr-1.5" />
                  Edit
                </Link>
              </Button>
            )}
            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Task</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{currentTask.title}"?
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-4">
          {/* Description */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentTask.description || "No description provided."}
              </p>
            </CardContent>
          </Card>

          {/* Status Update */}
          {canUpdateStatus && (
            <Card className="border border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  Update Status
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <Select
                    value={currentTask.status}
                    onValueChange={handleStatusChange}
                    disabled={isUpdatingStatus}
                  >
                    <SelectTrigger className="flex-1 h-9 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(
                        ([val, { icon, label }]) => (
                          <SelectItem key={val} value={val}>
                            <div className="flex items-center gap-2">
                              {icon}
                              {label}
                            </div>
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  {isUpdatingStatus && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  <Badge
                    variant="outline"
                    className={`${getTaskStatusColor(currentTask.status)} flex items-center gap-1 shrink-0`}
                  >
                    <TaskStatusIcon taskStatus={currentTask.status} />
                    {currentTask.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 space-y-0">
              {[
                {
                  label: "Created",
                  value: format(
                    new Date(currentTask.createdAt),
                    "MMM dd, yyyy 'at' h:mm a"
                  ),
                  cls: "",
                },
                {
                  label: "Last Updated",
                  value: format(
                    new Date(currentTask.updatedAt),
                    "MMM dd, yyyy 'at' h:mm a"
                  ),
                  cls: "",
                },
                ...(currentTask.completedAt
                  ? [
                      {
                        label: "Completed",
                        value: format(
                          new Date(currentTask.completedAt),
                          "MMM dd, yyyy 'at' h:mm a"
                        ),
                        cls: "text-emerald-600",
                      },
                    ]
                  : []),
              ].map(({ label, value, cls }, i, arr) => (
                <div key={label}>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-muted-foreground">
                      {label}
                    </span>
                    <span
                      className={`text-sm font-medium ${cls || "text-foreground"}`}
                    >
                      {value}
                    </span>
                  </div>
                  {i < arr.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Task Details */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Task Details</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Status</span>
                <Badge
                  variant="outline"
                  className={`${getTaskStatusColor(currentTask.status)} flex items-center gap-1 text-xs`}
                >
                  <TaskStatusIcon taskStatus={currentTask.status} />
                  {currentTask.status}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Priority</span>
                <Badge
                  variant="outline"
                  className={`${getPriorityColor(currentTask.priority)} flex items-center gap-1 text-xs`}
                >
                  <Flag className="h-3 w-3" />
                  {currentTask.priority}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Due Date</span>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span
                    className={`text-xs font-medium ${isOverdue ? "text-destructive" : isDueSoon ? "text-orange-500" : "text-foreground"}`}
                  >
                    {dueDate ? format(dueDate, "MMM dd, yyyy") : "Not set"}
                  </span>
                </div>
              </div>
              {(isOverdue || isDueSoon) && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Urgency
                    </span>
                    <Badge
                      variant={isOverdue ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {isOverdue
                        ? `${Math.abs(daysUntilDue)}d overdue`
                        : `Due in ${daysUntilDue}d`}
                    </Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Project */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                Project
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Link
                    to={`/projects/${currentTask.projectId}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {currentTask.projectName}
                  </Link>
                </HoverCardTrigger>
                <HoverCardContent className="w-64" side="left">
                  <p className="text-xs text-muted-foreground">
                    {project?.description || "No description available."}
                  </p>
                </HoverCardContent>
              </HoverCard>
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Assignment
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {currentTask.assignedToName
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs text-muted-foreground">Assigned to</p>
                  <p className="text-sm font-medium text-foreground">
                    {currentTask.assignedToName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {currentTask.assignedToEmail}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs font-semibold">
                    {currentTask.createdByName
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs text-muted-foreground">Created by</p>
                  <p className="text-sm font-medium text-foreground">
                    {currentTask.createdByName}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsPage;
