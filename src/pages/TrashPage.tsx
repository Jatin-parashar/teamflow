import { useEffect, useState } from "react";
import { useAppDispatch } from "@/app/hooks";
import { firebaseFetch } from "@/firebase/firebaseFetch";
import {
  restoreTask,
  permanentDeleteTask,
  type Task,
} from "@/features/taskSlice";
import {
  restoreProject,
  permanentDeleteProject,
  type Project,
} from "@/features/projectSlice";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Trash2, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import PageHeader from "@/components/PageHeader";

const TrashPage = () => {
  const dispatch = useAppDispatch();
  const [deletedTasks, setDeletedTasks] = useState<Task[]>([]);
  const [deletedProjects, setDeletedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeleted = async () => {
      try {
        const [tasks, projects] = await Promise.all([
          firebaseFetch<Record<string, Omit<Task, "id">> | null>("tasks.json"),
          firebaseFetch<Record<string, Omit<Project, "id">> | null>(
            "projects.json"
          ),
        ]);

        if (tasks) {
          setDeletedTasks(
            Object.keys(tasks)
              .map((k) => ({ id: k, ...tasks[k] }))
              .filter((t) => t.isDeleted)
          );
        }
        if (projects) {
          setDeletedProjects(
            Object.keys(projects)
              .map((k) => ({ id: k, ...projects[k] }))
              .filter((p) => p.isDeleted)
          );
        }
      } catch {
        toast.error("Failed to load trash");
      } finally {
        setLoading(false);
      }
    };
    fetchDeleted();
  }, []);

  const handleRestoreTask = async (taskId: string) => {
    try {
      await dispatch(restoreTask(taskId)).unwrap();
      setDeletedTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success("Task restored");
    } catch {
      toast.error("Failed to restore task");
    }
  };

  const handlePermanentDeleteTask = async (taskId: string) => {
    try {
      await dispatch(permanentDeleteTask(taskId)).unwrap();
      setDeletedTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success("Task permanently deleted");
    } catch {
      toast.error("Failed to delete task");
    }
  };

  const handleRestoreProject = async (projectId: string) => {
    try {
      await dispatch(restoreProject(projectId)).unwrap();
      setDeletedProjects((prev) => prev.filter((p) => p.id !== projectId));
      toast.success("Project restored");
    } catch {
      toast.error("Failed to restore project");
    }
  };

  const handlePermanentDeleteProject = async (projectId: string) => {
    try {
      await dispatch(permanentDeleteProject(projectId)).unwrap();
      setDeletedProjects((prev) => prev.filter((p) => p.id !== projectId));
      toast.success("Project permanently deleted");
    } catch {
      toast.error("Failed to delete project");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const renderEmpty = (type: string) => (
    <div className="text-center py-12 text-muted-foreground text-sm">
      No deleted {type} found.
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trash"
        description="Restore or permanently delete items"
        backTo="/dashboard"
        backLabel="Back to Dashboard"
      />

      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">Tasks ({deletedTasks.length})</TabsTrigger>
          <TabsTrigger value="projects">
            Projects ({deletedProjects.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {deletedTasks.length === 0
                ? renderEmpty("tasks")
                : deletedTasks.map((task, i) => (
                    <div key={task.id}>
                      {i > 0 && <Separator />}
                      <div className="flex items-center justify-between p-4">
                        <div>
                          <p className="text-sm font-medium">{task.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {task.projectName} · Deleted{" "}
                            {task.deletedAt &&
                              format(new Date(task.deletedAt), "MMM dd, yyyy")}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestoreTask(task.id)}
                          >
                            <RotateCcw className="h-3.5 w-3.5 mr-1" />
                            Restore
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-3.5 w-3.5 mr-1" />
                                Delete Forever
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Permanently Delete
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete "{task.title}".
                                  This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handlePermanentDeleteTask(task.id)
                                  }
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete Forever
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {deletedProjects.length === 0
                ? renderEmpty("projects")
                : deletedProjects.map((project, i) => (
                    <div key={project.id}>
                      {i > 0 && <Separator />}
                      <div className="flex items-center justify-between p-4">
                        <div>
                          <p className="text-sm font-medium">{project.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-xs">
                              {project.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Deleted{" "}
                              {project.deletedAt &&
                                format(
                                  new Date(project.deletedAt),
                                  "MMM dd, yyyy"
                                )}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestoreProject(project.id)}
                          >
                            <RotateCcw className="h-3.5 w-3.5 mr-1" />
                            Restore
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-3.5 w-3.5 mr-1" />
                                Delete Forever
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Permanently Delete
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete "{project.title}"
                                  and all its tasks. This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handlePermanentDeleteProject(project.id)
                                  }
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete Forever
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrashPage;
