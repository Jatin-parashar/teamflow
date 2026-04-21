import Dashboard from "./pages/dashboard/Dashboard";
import { createBrowserRouter, RouterProvider } from "react-router";
import NotFound from "./pages/errors/NotFound";
import ErrorPage from "./pages/errors/ErrorPage";
import RootPage from "./pages/RootPage";
import SettingsPage from "./pages/settings/SettingsPage";
import UnauthorizedPage from "./pages/errors/UnauthorizedPage";
import AuthProtectedRoute from "./pages/auth/AuthProtectedRoute";
import AuthPage from "./pages/auth/AuthPage";
import ProjectsPage from "./pages/projects/ProjectsPage";
import RoleProtectedRoute from "./pages/auth/RoleProtectedRoute";
import CreateProjectPage from "./pages/projects/CreateProjectPage";
import ProjectDetailsPage from "./pages/projects/ProjectDetailsPage";
import EditProjectPage from "./pages/projects/EditProjectPage";
import TasksPage from "./pages/tasks/TasksPage";
import CreateTaskPage from "./pages/tasks/CreateTaskPage";
import TaskDetailsPage from "./pages/tasks/TaskDetailsPage";
import EditTaskPage from "./pages/tasks/EditTaskPage";
import { Permissions } from "./features/types";
import ManageMembers from "./pages/ManageMembers";
import UserManagement from "./pages/UserManagement";
import ActivityPage from "./pages/ActivityPage";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <AuthPage mode="login" />,
  },
  {
    path: "/register",
    element: <AuthPage mode="register" />,
  },
  {
    path: "/",
    element: (
      <AuthProtectedRoute>
        <RootPage />
      </AuthProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "/dashboard",
        element: <Dashboard />,
      },
      {
        path: "/settings",
        element: <SettingsPage />,
      },
      {
        path: "unauthorized",
        element: <UnauthorizedPage />,
      },
      {
        path: "activity",
        element: (
          <RoleProtectedRoute permission={Permissions.canViewActivity}>
            <ActivityPage />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "admin/users",
        element: (
          <RoleProtectedRoute permission={Permissions.canManageUsers}>
            <UserManagement />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "projects",
        element: <ProjectsPage />,
      },
      {
        path: "projects/create",
        element: (
          <RoleProtectedRoute permission={Permissions.canCreateProjects}>
            <CreateProjectPage />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "projects/:id",
        element: <ProjectDetailsPage />,
      },
      {
        path: "projects/:id/manage-members",
        element: (
          <RoleProtectedRoute permission={Permissions.canManageMembers}>
            <ManageMembers />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "projects/:id/edit",
        element: (
          <RoleProtectedRoute permission={Permissions.canEditProject}>
            <EditProjectPage />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "tasks",
        element: <TasksPage />,
      },
      {
        path: "tasks/create",
        element: (
          <RoleProtectedRoute permission={Permissions.canCreateTasks}>
            <CreateTaskPage />
          </RoleProtectedRoute>
        ),
      },
      {
        path: "tasks/:id",
        element: <TaskDetailsPage />,
      },
      {
        path: "tasks/:id/edit",
        element: (
          <RoleProtectedRoute permission={Permissions.canEditTasks}>
            <EditTaskPage />
          </RoleProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
