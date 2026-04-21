import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { fetchProjects } from "@/features/projectSlice";
import { fetchTasks } from "@/features/taskSlice";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { TaskStatus } from "@/features/types";
import { Link } from "react-router";

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
  };

  return (
    <div className="flex flex-col gap-7">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Projects</p>
            <p className="text-xl font-bold">{projects.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Tasks</p>
            <p className="text-xl font-bold">{taskStats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Tasks Done</p>
            <p className="text-xl font-bold text-green-600">{taskStats.done}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Blocked Tasks</p>
            <p className="text-xl font-bold text-red-500">
              {taskStats.blocked}
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Projects Overview</h2>
        <div className="space-y-4">
          {projects.map((project) => (
            <Link
              to={`/projects/${project.id}`}
              key={project.id}
              className="block border p-4 rounded-lg shadow-sm bg-white dark:bg-neutral-900 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-medium">{project.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {project.description}
                  </p>
                </div>
                <div className="space-x-2">
                  <Badge>{project.status}</Badge>
                  <Badge variant="outline">{project.priority}</Badge>
                </div>
              </div>
              <Separator className="my-2" />
              <div className="text-sm text-muted-foreground">
                <span>Manager: </span>
                <span className="font-medium text-foreground">
                  {project.managerName || "Unassigned"}
                </span>
                <span className="ml-4">
                  Members: {project.members?.length || 0}
                </span>
              </div>
            </Link>
          ))}
          {projects.length === 0 && (
            <div className="text-muted-foreground bg-muted/30 text-center px-5 py-7 rounded-xl">
              No projects created yet
            </div>
          )}
        </div>
      </div>

      {projects.length !== 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Task Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project) => {
              const projectTasks = tasks.filter(
                (task) => task.projectId === project.id
              );
              return (
                <Card key={project.id}>
                  <CardContent className="p-4 space-y-1">
                    <p className="font-medium">{project.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Tasks: {projectTasks.length} | Done:{" "}
                      {
                        projectTasks.filter((t) => t.status === TaskStatus.DONE)
                          .length
                      }
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
