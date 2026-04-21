import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { fetchTasks } from "@/features/taskSlice";
import { fetchProjects } from "@/features/projectSlice";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { CheckCircle, Clock, AlertTriangle, Calendar, FolderOpen } from "lucide-react";
import { Link } from "react-router";

const TeamMemberDashboard = () => {
  const dispatch = useAppDispatch();
  const { tasks } = useAppSelector((state) => state.tasks);
  const { projects } = useAppSelector((state) => state.projects);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchTasks());
    dispatch(fetchProjects());
  }, [dispatch]);

  const myTasks = tasks.filter((task) => task.assignedTo === user?.id);
  const myProjects = projects.filter((project) =>
    project.members?.some((member) => member.userId === user?.id)
  );

  const taskStats = {
    total: myTasks.length,
    done: myTasks.filter((t) => t.status === "Done").length,
    inProgress: myTasks.filter((t) => t.status === "In Progress").length,
    todo: myTasks.filter((t) => t.status === "To Do").length,
    blocked: myTasks.filter((t) => t.status === "Blocked").length,
    overdue: myTasks.filter(
      (t) => new Date(t.dueDate) < new Date() && t.status !== "Done"
    ).length,
  };

  const completionRate =
    taskStats.total > 0 ? (taskStats.done / taskStats.total) * 100 : 0;

  const upcomingTasks = myTasks.filter((task) => {
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return dueDate >= today && dueDate <= nextWeek && task.status !== "Done";
  });

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">My Tasks</p>
                <p className="text-2xl font-bold">{taskStats.total}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {taskStats.done}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">
                  {taskStats.inProgress}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-500">
                  {taskStats.overdue}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>My Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Task Completion Rate</span>
              <span className="text-sm text-muted-foreground">
                {completionRate.toFixed(1)}%
              </span>
            </div>
            <Progress value={completionRate} className="h-2" />
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {taskStats.todo}
                </div>
                <div className="text-xs text-muted-foreground">To Do</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {taskStats.inProgress}
                </div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {taskStats.done}
                </div>
                <div className="text-xs text-muted-foreground">Done</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {taskStats.blocked}
                </div>
                <div className="text-xs text-muted-foreground">Blocked</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>My Active Tasks</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to="/tasks">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myTasks
                .filter((task) => task.status !== "Done")
                .slice(0, 5)
                .map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50"
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${
                        task.status === "In Progress"
                          ? "bg-blue-500"
                          : task.status === "Blocked"
                          ? "bg-red-500"
                          : "bg-gray-400"
                      }`}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{task.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {task.projectName} • Due:{" "}
                        {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant={
                          task.priority === "Critical"
                            ? "destructive"
                            : task.priority === "High"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {task.priority}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {task.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              {myTasks.filter((task) => task.status !== "Done").length ===
                0 && (
                <p className="text-center text-muted-foreground py-4">
                  No active tasks at the moment
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingTasks.slice(0, 5).map((task) => {
                const dueDate = new Date(task.dueDate);
                const today = new Date();
                const daysUntilDue = Math.ceil(
                  (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                );

                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{task.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {task.projectName}
                      </p>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-sm font-medium ${
                          daysUntilDue <= 1
                            ? "text-red-600"
                            : daysUntilDue <= 3
                            ? "text-orange-600"
                            : "text-green-600"
                        }`}
                      >
                        {daysUntilDue === 0
                          ? "Today"
                          : daysUntilDue === 1
                          ? "Tomorrow"
                          : `${daysUntilDue} days`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {dueDate.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
              {upcomingTasks.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No upcoming deadlines
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>My Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myProjects.length === 0 && (
              <div className="col-span-3 text-center py-8 text-muted-foreground">
                <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>You haven't been assigned to any projects yet</p>
              </div>
            )}
            {myProjects.map((project) => {
              const projectTasks = myTasks.filter(
                (task) => task.projectId === project.id
              );
              const completedTasks = projectTasks.filter(
                (task) => task.status === "Done"
              ).length;
              const projectProgress =
                projectTasks.length > 0
                  ? (completedTasks / projectTasks.length) * 100
                  : 0;

              return (
                <Card
                  key={project.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-sm truncate">
                        {project.title}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {project.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {project.description}
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          My Progress
                        </span>
                        <span className="text-xs font-medium">
                          {projectProgress.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={projectProgress} className="h-1" />
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>
                          {completedTasks}/{projectTasks.length} tasks
                        </span>
                        <span>{project.members?.length || 0} members</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default TeamMemberDashboard;
