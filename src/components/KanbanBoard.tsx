import { useState } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Calendar,
  Eye,
  GripVertical,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { TaskStatus as TS } from "@/features/types";
import { getPriorityColor, getTaskStatusColor } from "@/utils/roleUtilities";
import type { Task } from "@/features/taskSlice";
import type { TaskStatus } from "@/features/types";

const COLUMNS: {
  status: TaskStatus;
  label: string;
  icon: React.ReactNode;
  accent: string;
}[] = [
  {
    status: TS.TO_DO,
    label: "To Do",
    icon: <Clock className="h-3.5 w-3.5" />,
    accent: "border-t-slate-400",
  },
  {
    status: TS.IN_PROGRESS,
    label: "In Progress",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    accent: "border-t-blue-500",
  },
  {
    status: TS.DONE,
    label: "Done",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    accent: "border-t-emerald-500",
  },
  {
    status: TS.BLOCKED,
    label: "Blocked",
    icon: <XCircle className="h-3.5 w-3.5" />,
    accent: "border-t-destructive",
  },
];

interface KanbanBoardProps {
  tasks: Task[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}

const KanbanBoard = ({ tasks, onStatusChange }: KanbanBoardProps) => {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
    setDraggingId(taskId);
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status !== status) onStatusChange(taskId, status);
    setDraggingId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map(({ status, label, icon, accent }) => {
          const columnTasks = tasks.filter((t) => t.status === status);
          const isOver = dragOverColumn === status;

          return (
            <div
              key={status}
              onDrop={(e) => handleDrop(e, status)}
              onDragOver={(e) => handleDragOver(e, status)}
              onDragLeave={() => setDragOverColumn(null)}
              className={`flex flex-col gap-2 min-h-[480px] rounded-xl border-t-4 border border-border bg-muted/40 p-3 transition-all duration-150 ${accent} ${
                isOver ? "bg-accent/60 ring-2 ring-ring ring-offset-1" : ""
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-1 py-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  {icon}
                  <span className="text-sm font-semibold text-foreground">
                    {label}
                  </span>
                </div>
                <Badge
                  variant="secondary"
                  className="h-5 min-w-5 px-1.5 text-xs tabular-nums"
                >
                  {columnTasks.length}
                </Badge>
              </div>

              <Separator className="mb-1" />

              {/* Task Cards */}
              {columnTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragEnd={() => setDraggingId(null)}
                  className={`transition-all duration-150 ${
                    draggingId === task.id
                      ? "opacity-30 scale-95"
                      : "opacity-100"
                  }`}
                >
                  <Card className="cursor-grab active:cursor-grabbing border border-border bg-card shadow-sm hover:shadow-md hover:border-ring/50 transition-all duration-150 group">
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm font-medium flex items-start gap-2 leading-snug">
                        <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-0.5 group-hover:text-muted-foreground transition-colors" />
                        <span className="line-clamp-2 text-foreground">
                          {task.title}
                        </span>
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="p-3 pt-0 space-y-3">
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1.5">
                        <Badge
                          variant="outline"
                          className={`${getTaskStatusColor(task.status)} text-xs px-1.5 py-0`}
                        >
                          {task.status}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`${getPriorityColor(task.priority)} text-xs px-1.5 py-0`}
                        >
                          {task.priority}
                        </Badge>
                      </div>

                      <Separator />

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Assignee Avatar */}
                          {task.assignedToName && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Avatar className="h-6 w-6 cursor-default">
                                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                                    {task.assignedToName
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase()
                                      .slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="text-xs">
                                {task.assignedToName}
                              </TooltipContent>
                            </Tooltip>
                          )}

                          {/* Due Date */}
                          {task.dueDate && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {format(new Date(task.dueDate), "MMM d")}
                              </span>
                            </div>
                          )}
                        </div>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              asChild
                            >
                              <Link to={`/tasks/${task.id}`}>
                                <Eye className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs">
                            View task
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}

              {/* Empty State */}
              {columnTasks.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/60 py-8 text-center">
                  <div className="text-muted-foreground/40">{icon}</div>
                  <p className="text-xs text-muted-foreground">
                    Drop tasks here
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default KanbanBoard;
