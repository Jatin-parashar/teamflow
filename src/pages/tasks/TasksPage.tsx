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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "react-router";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Calendar,
  Search,
  Shield,
  LayoutList,
  LayoutGrid,
  ListTodo,
  TriangleAlert,
} from "lucide-react";
import {
  Role,
  type TaskStatus,
  TaskStatus as TS,
  RequestStatus,
  Priority,
  Permissions,
  hasMinRole,
} from "@/features/types";
import { toast } from "sonner";
import { format } from "date-fns";
import LoaderIcon from "@/components/ui/loader";
import { getTaskStatusColor, getPriorityColor } from "@/utils/roleUtilities";
import KanbanBoard from "@/components/KanbanBoard";

const TASKS_PER_PAGE = 10;

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
  const [viewMode, setViewMode] = useState<"list" | "board">("list");

  useEffect(() => {
    dispatch(fetchTasks());
    dispatch(fetchProjects());
  }, [dispatch]);

  const handleDeleteTask = async (taskId: string) => {
    try {
      await dispatch(deleteTask(taskId)).unwrap();
      toast.success("Task deleted successfully");
    } catch (_error) {
      toast.error("Failed to delete task");
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await dispatch(updateTaskStatus({ taskId, status: newStatus })).unwrap();
      toast.success("Task status updated");
    } catch (_error) {
      toast.error("Failed to update task status");
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TS.TO_DO:
        return <Clock className="w-3.5 h-3.5" />;
      case TS.IN_PROGRESS:
        return <AlertCircle className="w-3.5 h-3.5" />;
      case TS.DONE:
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      case TS.BLOCKED:
        return <XCircle className="w-3.5 h-3.5" />;
      default:
        return <Clock className="w-3.5 h-3.5" />;
    }
  };

  const getFilteredTasksByRole = (): Task[] => {
    if (!user) return [];
    if (hasMinRole(user.role, Role.ADMIN)) return tasks;
    if (hasMinRole(user.role, Role.MANAGER)) {
      return tasks.filter((task) => {
        const project = projects.find((p) => p.id === task.projectId);
        return (
          project &&
          (project.managerId === user.id ||
            project.members?.some((m) => m.userId === user.id))
        );
      });
    }
    return tasks.filter((task) => {
      const project = projects.find((p) => p.id === task.projectId);
      return (
        task.assignedTo === user.id ||
        (project && project.members?.some((m) => m.userId === user.id))
      );
    });
  };

  const roleBasedTasks = getFilteredTasksByRole();

  const filteredTasks = roleBasedTasks.filter((task) => {
    const matchesSearch =
      (task.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (task.projectName || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || task.priority === priorityFilter;
    const matchesProject =
      projectFilter === "all" || task.projectId === projectFilter;
    const isValidProject = projects.some((p) => p.id === task.projectId);
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
  const canEditTask = (task: Task) =>
    user
      ? Permissions.canEditTasks(user.role) ||
        projects.some((p) => p.id === task.projectId && p.managerId === user.id)
      : false;
  const canDeleteTask = (task: Task) =>
    user
      ? Permissions.canDeleteTasks(user.role) ||
        projects.some((p) => p.id === task.projectId && p.managerId === user.id)
      : false;

  const taskStats = {
    total: roleBasedTasks.length,
    todo: roleBasedTasks.filter((t) => t.status === TS.TO_DO).length,
    inProgress: roleBasedTasks.filter((t) => t.status === TS.IN_PROGRESS)
      .length,
    done: roleBasedTasks.filter((t) => t.status === TS.DONE).length,
    blocked: roleBasedTasks.filter((t) => t.status === TS.BLOCKED).length,
  };

  if (status === RequestStatus.LOADING) return <LoaderIcon />;

  if (status === RequestStatus.FAILED) {
    return (
      <div className="flex items-center justify-center h-96">
        <Alert variant="destructive" className="max-w-md">
          <TriangleAlert className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Tasks
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage and track your tasks
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center rounded-md border border-border bg-muted p-0.5 gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setViewMode("list")}
                  >
                    <LayoutList className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>List view</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "board" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setViewMode("board")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Board view</TooltipContent>
              </Tooltip>
            </div>

            {canCreateTask && (
              <Button asChild size="sm">
                <Link to="/tasks/create">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create Task
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            {
              label: "Total",
              value: taskStats.total,
              icon: <ListTodo className="h-4 w-4" />,
              cls: "text-foreground",
            },
            {
              label: "To Do",
              value: taskStats.todo,
              icon: <Clock className="h-4 w-4" />,
              cls: "text-muted-foreground",
            },
            {
              label: "In Progress",
              value: taskStats.inProgress,
              icon: <AlertCircle className="h-4 w-4" />,
              cls: "text-blue-500",
            },
            {
              label: "Done",
              value: taskStats.done,
              icon: <CheckCircle2 className="h-4 w-4" />,
              cls: "text-emerald-500",
            },
            {
              label: "Blocked",
              value: taskStats.blocked,
              icon: <XCircle className="h-4 w-4" />,
              cls: "text-destructive",
            },
          ].map(({ label, value, icon, cls }) => (
            <Card key={label} className="border border-border bg-card">
              <CardContent className="p-4">
                <div className={`flex items-center gap-2 mb-1 ${cls}`}>
                  {icon}
                  <span className="text-xs font-medium text-muted-foreground">
                    {label}
                  </span>
                </div>
                <p className={`text-2xl font-bold ${cls}`}>{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Role Badge */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/50 w-fit">
          <Shield className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Viewing as{" "}
            <span className="font-medium text-foreground">{user?.role}</span>
          </span>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <TriangleAlert className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card className="border border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              Filters
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="search"
                  className="text-xs text-muted-foreground"
                >
                  Search
                </Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search tasks..."
                    value={searchTerm}
                    autoComplete="off"
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-8 h-9 bg-background"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v as TaskStatus | "all");
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 bg-background">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value={TS.TO_DO}>To Do</SelectItem>
                    <SelectItem value={TS.IN_PROGRESS}>In Progress</SelectItem>
                    <SelectItem value={TS.DONE}>Done</SelectItem>
                    <SelectItem value={TS.BLOCKED}>Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Priority
                </Label>
                <Select
                  value={priorityFilter}
                  onValueChange={(v) => {
                    setPriorityFilter(v as Priority | "all");
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 bg-background">
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

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Project</Label>
                <Select
                  value={projectFilter}
                  onValueChange={(v) => {
                    setProjectFilter(v);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 bg-background">
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-9"
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

        {/* Board View */}
        {viewMode === "board" ? (
          <KanbanBoard
            tasks={filteredTasks}
            onStatusChange={handleStatusChange}
          />
        ) : (
          /* List View */
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Tasks{" "}
                <span className="text-muted-foreground font-normal text-sm">
                  ({filteredTasks.length})
                </span>
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              {filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
                  <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                    <Clock className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      No tasks found
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {Permissions.canCreateTasks(user?.role ?? Role.GUEST) &&
                      searchTerm
                        ? "Try adjusting your search filters"
                        : Permissions.canCreateTasks(user?.role ?? Role.GUEST)
                          ? "Get started by creating your first task"
                          : "No tasks have been assigned to you yet"}
                    </p>
                  </div>
                  {canCreateTask && !searchTerm && (
                    <Button asChild size="sm" className="mt-1">
                      <Link to="/tasks/create">
                        <Plus className="h-4 w-4 mr-1.5" />
                        Create Task
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Task
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Project
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Assignee
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Status
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Priority
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Due Date
                        </TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedTasks.map((task) => (
                        <TableRow
                          key={task.id}
                          className="hover:bg-muted/40 transition-colors"
                        >
                          <TableCell className="py-3">
                            <div className="space-y-0.5">
                              <p className="font-medium text-sm text-foreground">
                                {task.title}
                              </p>
                              {task.description && (
                                <p className="text-xs text-muted-foreground truncate max-w-xs">
                                  {task.description}
                                </p>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="py-3">
                            <span className="text-sm text-foreground">
                              {task.projectName}
                            </span>
                          </TableCell>

                          <TableCell className="py-3">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                                  {task.assignedToName
                                    ?.split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()
                                    .slice(0, 2) ?? "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium text-foreground leading-none">
                                  {task.assignedToName}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {task.assignedToEmail}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="py-3">
                            <Badge
                              variant="outline"
                              className={`${getTaskStatusColor(task.status)} flex items-center gap-1 w-fit text-xs`}
                            >
                              {getStatusIcon(task.status)}
                              {task.status}
                            </Badge>
                          </TableCell>

                          <TableCell className="py-3">
                            <Badge
                              variant="outline"
                              className={`${getPriorityColor(task.priority)} w-fit text-xs`}
                            >
                              {task.priority}
                            </Badge>
                          </TableCell>

                          <TableCell className="py-3">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Calendar className="w-3.5 h-3.5" />
                              <span className="text-sm">
                                {format(new Date(task.dueDate), "MMM dd, yyyy")}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="py-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                                  Actions
                                </DropdownMenuLabel>
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
                                {(Permissions.canUpdateTaskStatus(
                                  user?.role ?? Role.GUEST
                                ) ||
                                  task.assignedTo === user?.id) && (
                                  <>
                                    <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                                      Change Status
                                    </DropdownMenuLabel>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(task.id, TS.TO_DO)
                                      }
                                      disabled={task.status === TS.TO_DO}
                                    >
                                      <Clock className="w-4 h-4 mr-2" />
                                      To Do
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(
                                          task.id,
                                          TS.IN_PROGRESS
                                        )
                                      }
                                      disabled={task.status === TS.IN_PROGRESS}
                                    >
                                      <AlertCircle className="w-4 h-4 mr-2" />
                                      In Progress
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(task.id, TS.DONE)
                                      }
                                      disabled={task.status === TS.DONE}
                                    >
                                      <CheckCircle2 className="w-4 h-4 mr-2" />
                                      Done
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(task.id, TS.BLOCKED)
                                      }
                                      disabled={task.status === TS.BLOCKED}
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Blocked
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {canDeleteTask(task) && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <DropdownMenuItem
                                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
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
                                            onClick={() =>
                                              handleDeleteTask(task.id)
                                            }
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between px-4 py-3">
                        <p className="text-xs text-muted-foreground">
                          Showing{" "}
                          <span className="font-medium text-foreground">
                            {(currentPage - 1) * TASKS_PER_PAGE + 1}–
                            {Math.min(
                              currentPage * TASKS_PER_PAGE,
                              filteredTasks.length
                            )}
                          </span>{" "}
                          of{" "}
                          <span className="font-medium text-foreground">
                            {filteredTasks.length}
                          </span>
                        </p>
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-3 text-xs"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((p) => p - 1)}
                          >
                            Previous
                          </Button>
                          <span className="text-xs text-muted-foreground px-1">
                            {currentPage} / {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-3 text-xs"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((p) => p + 1)}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};

export default TasksPage;
