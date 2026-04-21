import { useEffect } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { fetchProjects } from "@/features/projectSlice";
import { fetchTasks } from "@/features/taskSlice";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { TaskStatus } from "@/features/types";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import { getPriorityColor, getTaskStatusColor } from "@/utils/roleUtilities";
import {
  FolderOpen,
  ListTodo,
  CheckCircle2,
  AlertCircle,
  Plus,
  Clock,
  ArrowRight,
  Users,
  Calendar,
} from "lucide-react";

const DAYS_IN_MS = 1000 * 60 * 60 * 24;

const ProjectManagerDashboard = () => {
  const dispatch = useAppDispatch();
  const { projects } = useAppSelector((state) => state.projects);
  const { tasks } = useAppSelector((state) => state.tasks);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchTasks());
  }, [dispatch]);

  const myProjects = projects.filter((p) => p.managerId === user?.id);
  const myTasks = tasks.filter((t) =>
    myProjects.some((p) => p.id === t.projectId)
  );

  const taskStats = {
    total: myTasks.length,
    done: myTasks.filter((t) => t.status === TaskStatus.DONE).length,
    inProgress: myTasks.filter((t) => t.status === TaskStatus.IN_PROGRESS)
      .length,
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
        due <= new Date(now.getTime() + 7 * DAYS_IN_MS) &&
        t.status !== TaskStatus.DONE
      );
    })
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="My Projects"
          value={myProjects.length}
          icon={FolderOpen}
          iconClass="text-primary"
          valueClass="text-foreground"
        />
        <StatCard
          label="Total Tasks"
          value={taskStats.total}
          icon={ListTodo}
          iconClass="text-muted-foreground"
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
          label="Overdue"
          value={taskStats.overdue}
          icon={AlertCircle}
          iconClass="text-destructive"
          valueClass="text-destructive"
        />
      </div>

      {/* Progress + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border border-border bg-card">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Task Completion Rate
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
                  value: myTasks.filter((t) => t.status === TaskStatus.TO_DO)
                    .length,
                  cls: "text-muted-foreground",
                },
                {
                  label: "Active",
                  value: taskStats.inProgress,
                  cls: "text-blue-500",
                },
                {
                  label: "Done",
                  value: taskStats.done,
                  cls: "text-emerald-500",
                },
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

        <Card className="border border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start gap-2" size="sm" asChild>
              <Link to="/tasks/create">
                <Plus className="h-4 w-4" />
                Create Task
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              size="sm"
              asChild
            >
              <Link to="/projects">
                <FolderOpen className="h-4 w-4" />
                View Projects
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              size="sm"
              asChild
            >
              <Link to="/tasks">
                <ListTodo className="h-4 w-4" />
                View Tasks
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="projects">
        <TabsList className="bg-muted border border-border">
          <TabsTrigger value="projects" className="gap-1.5">
            <FolderOpen className="h-3.5 w-3.5" />
            My Projects ({myProjects.length})
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Upcoming ({upcomingTasks.length})
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5">
            <ListTodo className="h-3.5 w-3.5" />
            Recent Tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myProjects.length === 0 ? (
              <div className="col-span-2">
                <EmptyState
                  icon={FolderOpen}
                  title="No projects assigned"
                  description="You haven't been assigned as manager to any projects yet."
                />
              </div>
            ) : (
              myProjects.slice(0, 6).map((project) => {
                const pt = tasks.filter((t) => t.projectId === project.id);
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
                        <Badge
                          variant="outline"
                          className={`${getPriorityColor(project.priority)} text-xs shrink-0`}
                        >
                          {project.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span className="tabular-nums">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {project.members?.length ?? 0} members
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          asChild
                        >
                          <Link to={`/projects/${project.id}`}>
                            View <ArrowRight className="h-3 w-3 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
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
                            className={`${getTaskStatusColor(task.status)} text-xs`}
                          >
                            {task.status}
                          </Badge>
                          <span
                            className={`text-xs font-medium tabular-nums ${daysLeft <= 1 ? "text-destructive" : daysLeft <= 3 ? "text-orange-500" : "text-emerald-600"}`}
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

        <TabsContent value="activity" className="mt-4">
          <Card className="border border-border bg-card">
            <ScrollArea className="h-[320px]">
              <div className="p-4 space-y-2">
                {myTasks.length === 0 ? (
                  <EmptyState
                    icon={ListTodo}
                    title="No tasks yet"
                    description="Tasks assigned to your projects will appear here."
                  />
                ) : (
                  myTasks.slice(0, 10).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:bg-accent/40 transition-colors"
                    >
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                          {task.assignedToName
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2) ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {task.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {task.projectName} · {task.assignedToName}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`${getTaskStatusColor(task.status)} text-xs shrink-0`}
                      >
                        {task.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectManagerDashboard;
