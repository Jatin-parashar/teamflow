import { useEffect } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { fetchProjects } from "@/features/projectSlice";
import { fetchTasks } from "@/features/taskSlice";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { TaskStatus, ProjectStatus } from "@/features/types";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import { getPriorityColor, getProjectStatusColor } from "@/utils/roleUtilities";
import {
  FolderOpen,
  ListTodo,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

const AdminDashboard = () => {
  const dispatch = useAppDispatch();
  const { projects } = useAppSelector((state) => state.projects);
  const { tasks } = useAppSelector((state) => state.tasks);

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchTasks());
  }, [dispatch]);

  const taskStats = {
    total: tasks.length,
    done: tasks.filter((t) => t.status === TaskStatus.DONE).length,
    blocked: tasks.filter((t) => t.status === TaskStatus.BLOCKED).length,
    inProgress: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
    todo: tasks.filter((t) => t.status === TaskStatus.TO_DO).length,
  };

  const projectStats = {
    total: projects.length,
    inProgress: projects.filter((p) => p.status === ProjectStatus.IN_PROGRESS)
      .length,
    completed: projects.filter((p) => p.status === ProjectStatus.COMPLETED)
      .length,
    onHold: projects.filter((p) => p.status === ProjectStatus.ON_HOLD).length,
  };

  const completionRate =
    taskStats.total > 0
      ? Math.round((taskStats.done / taskStats.total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Projects"
          value={projectStats.total}
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
          label="Blocked"
          value={taskStats.blocked}
          icon={XCircle}
          iconClass="text-destructive"
          valueClass="text-destructive"
        />
      </div>

      {/* Overall Progress */}
      <Card className="border border-border bg-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                Overall Task Completion
              </span>
            </div>
            <span className="text-sm font-bold text-foreground tabular-nums">
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
                label: "In Progress",
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

      {/* Tabs: Projects / Tasks */}
      <Tabs defaultValue="projects">
        <TabsList className="bg-muted border border-border">
          <TabsTrigger value="projects" className="gap-1.5">
            <FolderOpen className="h-3.5 w-3.5" />
            Projects ({projectStats.total})
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-1.5">
            <ListTodo className="h-3.5 w-3.5" />
            Task Summary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-4">
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">All Projects</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/projects">
                  View All <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <Separator />
            <ScrollArea className="h-[360px]">
              <div className="p-4 space-y-2">
                {projects.length === 0 ? (
                  <EmptyState
                    icon={FolderOpen}
                    title="No projects yet"
                    description="Create your first project to get started."
                  />
                ) : (
                  projects.map((project) => {
                    const projectTasks = tasks.filter(
                      (t) => t.projectId === project.id
                    );
                    const done = projectTasks.filter(
                      (t) => t.status === TaskStatus.DONE
                    ).length;
                    const progress =
                      projectTasks.length > 0
                        ? Math.round((done / projectTasks.length) * 100)
                        : 0;

                    return (
                      <HoverCard key={project.id}>
                        <HoverCardTrigger asChild>
                          <Link
                            to={`/projects/${project.id}`}
                            className="flex items-center justify-between p-3 rounded-lg border border-border bg-background hover:bg-accent/50 transition-colors group"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                  {project.title}
                                </p>
                                <Badge
                                  variant="outline"
                                  className={`${getProjectStatusColor(project.status)} text-xs shrink-0`}
                                >
                                  {project.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3">
                                <Progress
                                  value={progress}
                                  className="h-1.5 flex-1"
                                />
                                <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                                  {progress}%
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4 shrink-0">
                              <Badge
                                variant="outline"
                                className={`${getPriorityColor(project.priority)} text-xs`}
                              >
                                {project.priority}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Users className="h-3 w-3" />
                                {project.members?.length ?? 0}
                              </div>
                            </div>
                          </Link>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-72" side="right">
                          <div className="space-y-2">
                            <p className="font-semibold text-sm">
                              {project.title}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-3">
                              {project.description}
                            </p>
                            <Separator />
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">
                                  Manager:{" "}
                                </span>
                                <span className="font-medium">
                                  {project.managerName || "Unassigned"}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Tasks:{" "}
                                </span>
                                <span className="font-medium">
                                  {projectTasks.length}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Done:{" "}
                                </span>
                                <span className="font-medium text-emerald-600">
                                  {done}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Members:{" "}
                                </span>
                                <span className="font-medium">
                                  {project.members?.length ?? 0}
                                </span>
                              </div>
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.length === 0 ? (
              <div className="col-span-2">
                <EmptyState
                  icon={ListTodo}
                  title="No task data"
                  description="Create projects and tasks to see the summary."
                />
              </div>
            ) : (
              projects.map((project) => {
                const projectTasks = tasks.filter(
                  (t) => t.projectId === project.id
                );
                const done = projectTasks.filter(
                  (t) => t.status === TaskStatus.DONE
                ).length;
                const blocked = projectTasks.filter(
                  (t) => t.status === TaskStatus.BLOCKED
                ).length;
                const inProgress = projectTasks.filter(
                  (t) => t.status === TaskStatus.IN_PROGRESS
                ).length;
                const progress =
                  projectTasks.length > 0
                    ? Math.round((done / projectTasks.length) * 100)
                    : 0;

                return (
                  <Card
                    key={project.id}
                    className="border border-border bg-card"
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm text-foreground truncate">
                          {project.title}
                        </p>
                        <Badge
                          variant="outline"
                          className={`${getProjectStatusColor(project.status)} text-xs shrink-0 ml-2`}
                        >
                          {project.status}
                        </Badge>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-sm font-bold text-blue-500 tabular-nums">
                            {inProgress}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Active
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-emerald-500 tabular-nums">
                            {done}
                          </p>
                          <p className="text-xs text-muted-foreground">Done</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-destructive tabular-nums">
                            {blocked}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Blocked
                          </p>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {projectTasks.length} total tasks
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
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
