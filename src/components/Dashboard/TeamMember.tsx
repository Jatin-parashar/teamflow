import { useEffect } from "react";
import { Link } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchTasks } from "@/features/taskSlice";
import { fetchProjects } from "@/features/projectSlice";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { TaskStatus } from "@/features/types";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import { getPriorityColor, getTaskStatusColor } from "@/utils/roleUtilities";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  FolderOpen,
  ListTodo,
  ArrowRight,
} from "lucide-react";

const DAYS_IN_MS = 1000 * 60 * 60 * 24;
const UPCOMING_DAYS = 7;

const TeamMemberDashboard = () => {
  const dispatch = useAppDispatch();
  const { tasks } = useAppSelector((state) => state.tasks);
  const { projects } = useAppSelector((state) => state.projects);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchTasks());
    dispatch(fetchProjects());
  }, [dispatch]);

  const myTasks = tasks.filter((t) => t.assignedTo === user?.id);
  const myProjects = projects.filter((p) =>
    p.members?.some((m) => m.userId === user?.id)
  );

  const taskStats = {
    total: myTasks.length,
    done: myTasks.filter((t) => t.status === TaskStatus.DONE).length,
    inProgress: myTasks.filter((t) => t.status === TaskStatus.IN_PROGRESS)
      .length,
    todo: myTasks.filter((t) => t.status === TaskStatus.TO_DO).length,
    blocked: myTasks.filter((t) => t.status === TaskStatus.BLOCKED).length,
    overdue: myTasks.filter(
      (t) => new Date(t.dueDate) < new Date() && t.status !== TaskStatus.DONE
    ).length,
  };

  const completionRate =
    taskStats.total > 0
      ? Math.round((taskStats.done / taskStats.total) * 100)
      : 0;

  const upcomingTasks = myTasks
    .filter((t) => {
      const due = new Date(t.dueDate);
      const now = new Date();
      return (
        due >= now &&
        due <= new Date(now.getTime() + UPCOMING_DAYS * DAYS_IN_MS) &&
        t.status !== TaskStatus.DONE
      );
    })
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

  const activeTasks = myTasks.filter((t) => t.status !== TaskStatus.DONE);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="My Tasks"
          value={taskStats.total}
          icon={ListTodo}
          iconClass="text-primary"
          valueClass="text-foreground"
        />
        <StatCard
          label="Completed"
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
          label="Overdue"
          value={taskStats.overdue}
          icon={AlertTriangle}
          iconClass="text-destructive"
          valueClass="text-destructive"
        />
      </div>

      {/* Progress Card */}
      <Card className="border border-border bg-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              My Task Completion
            </span>
            <span className="text-sm font-bold tabular-nums text-foreground">
              {completionRate}%
            </span>
          </div>
          <Progress value={completionRate} className="h-2" />
          <div className="grid grid-cols-4 gap-2 pt-1">
            {[
              {
                label: "To Do",
                value: taskStats.todo,
                cls: "text-muted-foreground",
              },
              {
                label: "Active",
                value: taskStats.inProgress,
                cls: "text-blue-500",
              },
              { label: "Done", value: taskStats.done, cls: "text-emerald-500" },
              {
                label: "Blocked",
                value: taskStats.blocked,
                cls: "text-destructive",
              },
            ].map(({ label, value, cls }) => (
              <div key={label} className="text-center">
                <p className={`text-lg font-bold tabular-nums ${cls}`}>
                  {value}
                </p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="active">
        <TabsList className="bg-muted border border-border">
          <TabsTrigger value="active" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Active ({activeTasks.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Upcoming ({upcomingTasks.length})
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-1.5">
            <FolderOpen className="h-3.5 w-3.5" />
            Projects ({myProjects.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <Card className="border border-border bg-card">
            <ScrollArea className="h-[320px]">
              <div className="p-4 space-y-2">
                {activeTasks.length === 0 ? (
                  <EmptyState
                    icon={CheckCircle2}
                    title="All caught up!"
                    description="No active tasks at the moment."
                  />
                ) : (
                  activeTasks.slice(0, 10).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:bg-accent/40 transition-colors"
                    >
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          task.status === TaskStatus.IN_PROGRESS
                            ? "bg-blue-500"
                            : task.status === TaskStatus.BLOCKED
                              ? "bg-destructive"
                              : "bg-muted-foreground"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {task.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {task.projectName} · Due{" "}
                          {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge
                          variant="outline"
                          className={`${getPriorityColor(task.priority)} text-xs`}
                        >
                          {task.priority}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`${getTaskStatusColor(task.status)} text-xs`}
                        >
                          {task.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            {activeTasks.length > 0 && (
              <>
                <Separator />
                <div className="p-3 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs gap-1"
                    asChild
                  >
                    <Link to="/tasks">
                      View All Tasks <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="upcoming" className="mt-4">
          <Card className="border border-border bg-card">
            <ScrollArea className="h-[320px]">
              <div className="p-4 space-y-2">
                {upcomingTasks.length === 0 ? (
                  <EmptyState
                    icon={Calendar}
                    title="No upcoming deadlines"
                    description="No tasks due in the next 7 days."
                  />
                ) : (
                  upcomingTasks.map((task) => {
                    const daysLeft = Math.ceil(
                      (new Date(task.dueDate).getTime() - Date.now()) /
                        DAYS_IN_MS
                    );
                    return (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border bg-background hover:bg-accent/40 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {task.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {task.projectName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-3 shrink-0">
                          <Badge
                            variant="outline"
                            className={`${getPriorityColor(task.priority)} text-xs`}
                          >
                            {task.priority}
                          </Badge>
                          <span
                            className={`text-xs font-semibold tabular-nums ${daysLeft <= 1 ? "text-destructive" : daysLeft <= 3 ? "text-orange-500" : "text-emerald-600"}`}
                          >
                            {daysLeft === 0
                              ? "Today"
                              : daysLeft === 1
                                ? "Tomorrow"
                                : `${daysLeft}d`}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myProjects.length === 0 ? (
              <div className="col-span-3">
                <EmptyState
                  icon={FolderOpen}
                  title="No projects yet"
                  description="You haven't been assigned to any projects yet."
                />
              </div>
            ) : (
              myProjects.map((project) => {
                const pt = myTasks.filter((t) => t.projectId === project.id);
                const done = pt.filter(
                  (t) => t.status === TaskStatus.DONE
                ).length;
                const progress =
                  pt.length > 0 ? Math.round((done / pt.length) * 100) : 0;
                return (
                  <Card
                    key={project.id}
                    className="border border-border bg-card hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm text-foreground truncate">
                          {project.title}
                        </p>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {project.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>My Progress</span>
                          <span className="tabular-nums">
                            {done}/{pt.length} tasks
                          </span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-7 text-xs gap-1"
                        asChild
                      >
                        <Link to={`/projects/${project.id}`}>
                          View Project <ArrowRight className="h-3 w-3" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamMemberDashboard;
