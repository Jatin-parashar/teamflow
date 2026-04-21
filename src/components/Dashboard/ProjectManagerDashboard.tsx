import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchProjects } from "@/features/projectSlice";
import { fetchTasks } from "@/features/taskSlice";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Plus, Users, Calendar, AlertCircle, FolderOpen, ListTodo } from "lucide-react";
import { Link } from "react-router";

const ProjectManagerDashboard = () => {
  const dispatch = useAppDispatch();
  const { projects } = useAppSelector((state) => state.projects);
  const { tasks } = useAppSelector((state) => state.tasks);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchTasks());
  }, [dispatch]);

  // Filter projects managed by current user
  const myProjects = projects.filter(project => project.managerId === user?.id);
  const myProjectTasks = tasks.filter(task => 
    myProjects.some(project => project.id === task.projectId)
  );

  const taskStats = {
    total: myProjectTasks.length,
    done: myProjectTasks.filter(t => t.status === "Done").length,
    blocked: myProjectTasks.filter(t => t.status === "Blocked").length,
    inProgress: myProjectTasks.filter(t => t.status === "In Progress").length,
    overdue: myProjectTasks.filter(t => 
      new Date(t.dueDate) < new Date() && t.status !== "Done"
    ).length,
  };

  const projectStats = {
    total: myProjects.length,
    inProgress: myProjects.filter(p => p.status === "In Progress").length,
    completed: myProjects.filter(p => p.status === "Completed").length,
    onHold: myProjects.filter(p => p.status === "On Hold").length,
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">My Projects</p>
                <p className="text-2xl font-bold">{projectStats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold">{taskStats.total}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{taskStats.done}</p>
              </div>
              <div className="text-green-500">✓</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-500">{taskStats.overdue}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button className="gap-2" asChild>
              <Link to="/tasks/create">
                <Plus className="h-4 w-4" />
                Create Task
              </Link>
            </Button>
            <Button variant="outline" className="gap-2" asChild>
              <Link to="/projects">
                <FolderOpen className="h-4 w-4" />
                View Projects
              </Link>
            </Button>
            <Button variant="outline" className="gap-2" asChild>
              <Link to="/tasks">
                <ListTodo className="h-4 w-4" />
                View Tasks
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">My Projects</h2>
          <Button variant="outline" size="sm" asChild>
            <Link to="/projects">View All</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myProjects.slice(0, 4).map(project => (
            <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium truncate">{project.title}</h3>
                  <Badge variant={project.status === "Completed" ? "default" : "secondary"}>
                    {project.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {project.description}
                </p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{project.members?.length || 0} members</span>
                  </div>
                  <Badge variant="outline">{project.priority}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {myProjects.length === 0 && (
            <div className="col-span-2 text-center py-8 text-muted-foreground">
              No projects assigned to you yet
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">In Progress</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-secondary rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${taskStats.total > 0 ? (taskStats.inProgress / taskStats.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{taskStats.inProgress}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Completed</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-secondary rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${taskStats.total > 0 ? (taskStats.done / taskStats.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{taskStats.done}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Blocked</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-secondary rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${taskStats.total > 0 ? (taskStats.blocked / taskStats.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{taskStats.blocked}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myProjectTasks.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No recent activity</p>
              ) : myProjectTasks.slice(0, 5).map(task => (
                <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.projectName} • {task.assignedToName}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {task.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ProjectManagerDashboard;
