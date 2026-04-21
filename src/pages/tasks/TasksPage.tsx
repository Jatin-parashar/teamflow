import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  fetchTasks,
  deleteTask,
  updateTaskStatus,
  type Task,
} from "@/features/taskSlice";
import { fetchProjects } from "@/features/projectSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Link } from "react-router";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Calendar,
  Search,
  Shield,
} from "lucide-react";
import {
  Role,
  type TaskStatus,
  RequestStatus,
  Priority,
  Permissions,
  hasMinRole,
} from "@/features/types";
import { toast } from "sonner";
import { format } from "date-fns";
import LoaderIcon from "@/components/ui/loader";
import { getTaskStatusColor, getPriorityColor } from "@/utils/roleUtilities";

const TasksPage = () => {
  const dispatch = useAppDispatch();
  const { tasks, status, error } = useAppSelector((state) => state.tasks);
  const { projects } = useAppSelector((state) => state.projects);
  const { user } = useAppSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const TASKS_PER_PAGE = 10;

  useEffect(() => {
    dispatch(fetchTasks());
    dispatch(fetchProjects());
  }, [dispatch]);

  const handleDeleteTask = async (taskId: string) => {
    try {
      await dispatch(deleteTask(taskId)).unwrap();
      toast.success("Task deleted successfully");
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await dispatch(updateTaskStatus({ taskId, status: newStatus })).unwrap();
      toast.success("Task status updated successfully");
    } catch (error) {
      toast.error("Failed to update task status");
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case "To Do":
        return <Clock className="w-4 h-4" />;
      case "In Progress":
        return <AlertCircle className="w-4 h-4" />;
      case "Done":
        return <CheckCircle className="w-4 h-4" />;
      case "Blocked":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getFilteredTasksByRole = (): Task[] => {
    if (!user) return [];
    if (hasMinRole(user.role, Role.ADMIN)) return tasks;
    if (hasMinRole(user.role, Role.MANAGER)) {
      return tasks.filter((task) => {
        const project = projects.find((p) => p.id === task.projectId);
        return project && (project.managerId === user.id || project.members?.some((m) => m.userId === user.id));
      });
    }
    return tasks.filter((task) => {
      const project = projects.find((p) => p.id === task.projectId);
      return task.assignedTo === user.id || (project && project.members?.some((m) => m.userId === user.id));
    });
  };

  const roleBasedTasks = getFilteredTasksByRole();

  const filteredTasks = roleBasedTasks.filter((task) => {
    const taskTitle = task.title || "";
    const taskDescription = task.description || "";
    const taskProjectName = task.projectName || "";

    const matchesSearch =
      taskTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      taskDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      taskProjectName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || task.priority === priorityFilter;
    const matchesProject =
      projectFilter === "all" || task.projectId === projectFilter;

    const isValidProject = projects.some(
      (project) => project.id === task.projectId
    );

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPriority &&
      matchesProject &&
      isValidProject
    );
  });

  const totalPages = Math.ceil(filteredTasks.length / TASKS_PER_PAGE);
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * TASKS_PER_PAGE,
    currentPage * TASKS_PER_PAGE
  );

  const canCreateTask = user ? Permissions.canCreateTasks(user.role) : false;
  const canEditTask = (task: Task) => {
    if (!user) return false;
    return Permissions.canEditTasks(user.role) || projects.some((p) => p.id === task.projectId && p.managerId === user.id);
  };
  const canDeleteTask = (task: Task) => {
    if (!user) return false;
    return Permissions.canDeleteTasks(user.role) || projects.some((p) => p.id === task.projectId && p.managerId === user.id);
  };

  if (status === RequestStatus.LOADING) {
    return <LoaderIcon />;
  }

  if (status === "failed") {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Error Loading Tasks
          </h2>
          <p className="text-gray-500 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  const taskStats = {
    total: roleBasedTasks.length,
    todo: roleBasedTasks.filter((task) => task.status === "To Do").length,
    inProgress: roleBasedTasks.filter((task) => task.status === "In Progress")
      .length,
    done: roleBasedTasks.filter((task) => task.status === "Done").length,
    blocked: roleBasedTasks.filter((task) => task.status === "Blocked").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            Tasks
          </h1>
          <p className="text-muted-foreground">
            Manage and track your tasks
          </p>
        </div>
        {canCreateTask && (
          <Button
            asChild
            className="bg-neutral-800 text-white hover:bg-red-950 transition-all delay-100 ease-in"
          >
            <Link to="/tasks/create">
              <Plus className="w-4 h-4 mr-2" />
              Create Task
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-slate-300">
                {taskStats.total}
              </div>
              <div className="text-sm text-gray-500 dark:text-slate-300">
                Total Tasks
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600 dark:text-slate-500">
                {taskStats.todo}
              </div>
              <div className="text-sm text-gray-500 dark:text-slate-300">
                To Do
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {taskStats.inProgress}
              </div>
              <div className="text-sm text-gray-500 dark:text-slate-300">
                In Progress
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {taskStats.done}
              </div>
              <div className="text-sm text-gray-500 dark:text-slate-300">
                Done
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {taskStats.blocked}
              </div>
              <div className="text-sm text-gray-500 dark:text-slate-300">
                Blocked
              </div>
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

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-4">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  autoComplete="off"
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-4">
              <Label htmlFor="status">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as TaskStatus | "all")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="To Do">To Do</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Done">Done</SelectItem>
                  <SelectItem value="Blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priorityFilter}
                onValueChange={(value) =>
                  setPriorityFilter(value as Priority | "all")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value={Priority.LOW}>Low</SelectItem>
                  <SelectItem value={Priority.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={Priority.HIGH}>High</SelectItem>
                  <SelectItem value={Priority.CRITICAL}>Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4">
              <Label htmlFor="project">Project</Label>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setPriorityFilter("all");
                  setProjectFilter("all");
                  setCurrentPage(1);
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tasks ({filteredTasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-slate-100">
                No tasks found
              </h3>
              <p className="text-gray-600 mb-4 dark:text-slate-200">
                {Permissions.canCreateTasks(user?.role || Role.GUEST) && searchTerm
                  ? "Try adjusting your search filters"
                  : Permissions.canCreateTasks(user?.role || Role.GUEST)
                  ? "Get started by creating your first task"
                  : "No tasks have been assigned to you yet"}
              </p>
            </div>
          ) : (
            <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{task.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {task.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {task.projectName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {task.assignedToName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {task.assignedToEmail}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${getTaskStatusColor(
                          task.status
                        )} flex items-center gap-1 w-fit`}
                      >
                        {getStatusIcon(task.status)}
                        {task.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${getPriorityColor(task.priority)} w-fit`}
                      >
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">
                          {format(new Date(task.dueDate), "MMM dd, yyyy")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link to={`/tasks/${task.id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {canEditTask(task) && (
                            <DropdownMenuItem asChild>
                              <Link to={`/tasks/${task.id}/edit`}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Task
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(task.id, "To Do")}
                            disabled={task.status === "To Do"}
                          >
                            <Clock className="w-4 h-4 mr-2" />
                            Mark as To Do
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(task.id, "In Progress")
                            }
                            disabled={task.status === "In Progress"}
                          >
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Mark as In Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(task.id, "Done")}
                            disabled={task.status === "Done"}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark as Done
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(task.id, "Blocked")
                            }
                            disabled={task.status === "Blocked"}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Mark as Blocked
                          </DropdownMenuItem>
                          {canDeleteTask(task) && (
                            <>
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Task
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Task
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "
                                      {task.title}"? This action cannot be
                                      undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteTask(task.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * TASKS_PER_PAGE + 1}–{Math.min(currentPage * TASKS_PER_PAGE, filteredTasks.length)} of {filteredTasks.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm font-medium">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TasksPage;
