import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  Edit,
  Users,
  Plus,
  Trash2,
  FileText,
  AlertCircle,
  CheckCircle,
  Mail,
  Shield,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { fetchProjectById, deleteProject } from "@/features/projectSlice";
import { fetchTasksByProject } from "@/features/taskSlice";
import { logActivity } from "@/firebase/activityLog";
import {
  getPriorityColor,
  getProjectStatusColor,
  getTaskStatusColor,
  formatDate,
} from "@/utils/roleUtilities";
import { RequestStatus, Permissions, TaskStatus } from "@/features/types";
import RoleIcon from "@/components/RoleIcon";
import ProjectStatusIcon from "@/components/ProjectStatusIcon";
import LoaderIcon from "@/components/ui/loader";

const ProjectDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    currentProject,
    status: projectStatus,
    error,
  } = useAppSelector((state) => state.projects);
  const { tasks, status: taskStatus } = useAppSelector((state) => state.tasks);
  const { user } = useAppSelector((state) => state.auth);

  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchProjectById(id));
      dispatch(fetchTasksByProject(id));
    }
  }, [dispatch, id]);

  const handleDeleteProject = async () => {
    if (
      !currentProject ||
      !window.confirm(
        "Are you sure you want to delete this project? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await dispatch(deleteProject(currentProject.id)).unwrap();
      await logActivity(user!.id, user!.name, "Deleted project", "project", currentProject.id, currentProject.title);
      toast.success("Project deleted successfully");
      navigate("/projects");
    } catch (error) {
      toast.error("Failed to delete project");
    } finally {
      setIsDeleting(false);
    }
  };

  const calculateProjectProgress = () => {
    if (!tasks.length) return 0;
    const completedTasks = tasks.filter(
      (task) => task.status === TaskStatus.DONE
    ).length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  const canEditProject = () => {
    return user ? Permissions.canEditProject(user.role) || currentProject?.managerId === user?.id : false;
  };

  const canDeleteProject = () => {
    return user ? Permissions.canDeleteProjects(user.role) : false;
  };

  const canCreateTask = () => {
    return user ? Permissions.canCreateTasks(user.role) : false;
  };

  if (projectStatus === RequestStatus.LOADING) {
    return <LoaderIcon />;
  }

  if (error || !currentProject) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/projects")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
            <span className="text-red-800">{error || "Project not found"}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/projects")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{currentProject.title}</h1>
            <p className="text-muted-foreground">Project Details</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canCreateTask() && (
            <Button asChild>
              <Link to={`/tasks/create?projectId=${currentProject.id}`}>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Link>
            </Button>
          )}
          {canEditProject() && (
            <Button variant="outline" asChild>
              <Link to={`/projects/${currentProject.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
          )}
          {canDeleteProject() && (
            <Button
              variant="destructive"
              onClick={handleDeleteProject}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Project Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-muted-foreground">
                  {currentProject.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Status</h4>
                  <Badge
                    variant="outline"
                    className={getProjectStatusColor(currentProject.status)}
                  >
                    <ProjectStatusIcon projectStatus={currentProject.status} />
                    <span className="ml-1">{currentProject.status}</span>
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Priority</h4>
                  <Badge
                    variant="outline"
                    className={getPriorityColor(currentProject.priority)}
                  >
                    {currentProject.priority}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Start Date</h4>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatDate(currentProject.startDate)}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">End Date</h4>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {currentProject.endDate ? formatDate(currentProject.endDate) : "Not set"}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Progress</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Completed Tasks</span>
                    <span>{calculateProjectProgress()}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${calculateProjectProgress()}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Tasks (
                  {
                    tasks.filter((task) => task.projectId === currentProject.id)
                      .length
                  }
                  )
                </div>
                {canCreateTask() && (
                  <Button size="sm" asChild>
                    <Link to={`/tasks/create?projectId=${currentProject.id}`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task
                    </Link>
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {taskStatus === RequestStatus.LOADING ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tasks created yet</p>
                  {canCreateTask() && (
                    <Button className="mt-4" size="sm" asChild>
                      <Link to={`/tasks/create?projectId=${currentProject.id}`}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Task
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks
                    .filter((task) => task.projectId === currentProject.id)
                    .map((task) => (
                      <div
                        key={task.id}
                        className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{task.title}</h4>
                              <Badge
                                variant="outline"
                                className={getTaskStatusColor(task.status)}
                              >
                                {task.status}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={getPriorityColor(task.priority)}
                              >
                                {task.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {task.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Assigned to: {task.assignedToName}</span>
                              <span>Due: {formatDate(task.dueDate)}</span>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/tasks/${task.id}`}>View</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Project Manager
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {currentProject.managerName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{currentProject.managerName}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {currentProject.managerId}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members ({currentProject.members?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentProject.members && currentProject.members.length > 0 ? (
                <div className="space-y-3">
                  {currentProject.members.map((member) => {
                    return (
                      <div
                        key={member.userId}
                        className="flex items-center gap-3"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {member.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{member.name}</p>
                            <RoleIcon role={member.role} />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No team members assigned</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Total Tasks</span>
                <span className="font-medium">{tasks.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Completed</span>
                <span className="font-medium text-green-600">
                  {tasks.filter((t) => t.status === "Done").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">In Progress</span>
                <span className="font-medium text-blue-600">
                  {tasks.filter((t) => t.status === "In Progress").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Blocked</span>
                <span className="font-medium text-red-600">
                  {tasks.filter((t) => t.status === "Blocked").length}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm">Created</span>
                <span className="font-medium text-xs">
                  {formatDate(currentProject.createdAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Last Updated</span>
                <span className="font-medium text-xs">
                  {formatDate(currentProject.updatedAt)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsPage;
