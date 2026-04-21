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
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  User,
  Building,
  Flag,
  MessageSquare,
  Activity,
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

const TaskDetailsPage = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { currentTask, status, error } = useAppSelector((state) => state.tasks);
  const { projects } = useAppSelector((state) => state.projects);
  const { user } = useAppSelector((state) => state.auth);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchTaskById(id));
      dispatch(fetchProjects());
    }
  }, [dispatch, id]);

  const handleDeleteTask = async () => {
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
    } catch (_error) {
      toast.error("Failed to delete task");
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!currentTask) return;

    setIsUpdatingStatus(true);
    try {
      await dispatch(
        updateTaskStatus({
          taskId: currentTask.id,
          status: newStatus,
        })
      ).unwrap();
      toast.success("Task status updated successfully");
    } catch (_error) {
      toast.error("Failed to update task status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const canEditTask = user ? Permissions.canEditTasks(user.role) : false;
  const canDeleteTask = user ? Permissions.canDeleteTasks(user.role) : false;
  const canUpdateStatus = user
    ? Permissions.canUpdateTaskStatus(user.role) ||
      currentTask?.assignedTo === user?.id
    : false;

  if (status === RequestStatus.LOADING) {
    return <LoaderIcon />;
  }

  if (status === RequestStatus.FAILED || !currentTask) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">
            {error || "Task not found"}
          </h2>
          <p className="text-gray-500 dark:text-neutral-300 mt-2">
            The task you're looking for doesn't exist or has been deleted.
          </p>
          <Button className="mt-4" onClick={() => navigate("/tasks")}>
            Back to Tasks
          </Button>
        </div>
      </div>
    );
  }

  const project = projects.find((p) => p.id === currentTask.projectId);
  const dueDate = currentTask.dueDate ? new Date(currentTask.dueDate) : null;
  const daysUntilDue = dueDate ? differenceInDays(dueDate, new Date()) : 0;
  const isOverdue = dueDate ? daysUntilDue < 0 : false;
  const isDueSoon = dueDate ? daysUntilDue <= 3 && daysUntilDue >= 0 : false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/tasks")}
            className="bg-neutral-100 text-black hover:bg-neutral-200 cursor-pointer hover:text-neutral-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tasks
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-200">
              {currentTask.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-neutral-200">
              Task ID: {currentTask.id}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {canEditTask && (
            <Button asChild variant="outline">
              <Link to={`/tasks/${currentTask.id}/edit`}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Task
              </Link>
            </Button>
          )}
          {canDeleteTask && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Task
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Task</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{currentTask.title}"? This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteTask}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 dark:text-neutral-200">
                  {currentTask.description || "No description provided."}
                </p>
              </div>
            </CardContent>
          </Card>

          {canUpdateStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Update Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Select
                      value={currentTask.status}
                      onValueChange={handleStatusChange}
                      disabled={isUpdatingStatus}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={TS.TO_DO}>To Do</SelectItem>
                        <SelectItem value={TS.IN_PROGRESS}>
                          In Progress
                        </SelectItem>
                        <SelectItem value={TS.DONE}>Done</SelectItem>
                        <SelectItem value={TS.BLOCKED}>Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Badge
                    className={`${getTaskStatusColor(
                      currentTask.status
                    )} flex items-center gap-1`}
                  >
                    <TaskStatusIcon taskStatus={currentTask.status} />
                    {currentTask.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-500">Created</span>
                <span className="text-sm font-medium">
                  {format(
                    new Date(currentTask.createdAt),
                    "MMM dd, yyyy 'at' h:mm a"
                  )}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-500">Last Updated</span>
                <span className="text-sm font-medium">
                  {format(
                    new Date(currentTask.updatedAt),
                    "MMM dd, yyyy 'at' h:mm a"
                  )}
                </span>
              </div>
              {currentTask.completedAt && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-500">Completed</span>
                    <span className="text-sm font-medium text-green-600">
                      {format(
                        new Date(currentTask.completedAt),
                        "MMM dd, yyyy 'at' h:mm a"
                      )}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">
                  Status
                </span>
                <Badge
                  className={`${getTaskStatusColor(
                    currentTask.status
                  )} flex items-center gap-1`}
                >
                  <TaskStatusIcon taskStatus={currentTask.status} />
                  {currentTask.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">
                  Priority
                </span>
                <Badge
                  className={`${getPriorityColor(
                    currentTask.priority
                  )} flex items-center gap-1`}
                >
                  <Flag className="w-3 h-3" />
                  {currentTask.priority}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">
                  Due Date
                </span>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span
                    className={`text-sm font-medium ${
                      isOverdue
                        ? "text-red-600"
                        : isDueSoon
                          ? "text-orange-600"
                          : "text-gray-900"
                    }`}
                  >
                    {dueDate ? format(dueDate, "MMM dd, yyyy") : "Not set"}
                  </span>
                </div>
              </div>

              {(isOverdue || isDueSoon) && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">
                    Status
                  </span>
                  <Badge variant={isOverdue ? "destructive" : "secondary"}>
                    {isOverdue
                      ? `${Math.abs(daysUntilDue)} days overdue`
                      : isDueSoon
                        ? `Due in ${daysUntilDue} days`
                        : ""}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Project
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link
                  to={`/projects/${currentTask.projectId}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {currentTask.projectName}
                </Link>
                <p className="text-sm text-gray-500">
                  {project?.description || "No project description available."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Assigned to</p>
                <p className="text-sm font-medium">
                  {currentTask.assignedToName}
                </p>
                <p className="text-xs text-gray-500">
                  {currentTask.assignedToEmail}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-gray-500">Created by</p>
                <p className="text-sm font-medium">
                  {currentTask.createdByName}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsPage;
