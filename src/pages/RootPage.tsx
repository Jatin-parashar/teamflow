import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { logoutUser } from "@/features/authSlice";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Home,
  Settings,
  Plus,
  CheckSquare,
  FolderOpen,
  ListTodo,
  type LucideIcon,
  Users,
  Activity,
} from "lucide-react";
import { Link, Outlet, useLocation } from "react-router";
import { Permissions, Role } from "@/features/types";
import { getInitials, getRoleBadgeStyle } from "@/utils/roleUtilities";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useEffect } from "react";
import NotificationBell from "@/components/NotificationBell";
import {
  startNotificationListener,
  clearNotificationState,
} from "@/firebase/notifications";

const SidebarAutoClose = () => {
  const { setOpenMobile } = useSidebar();
  const location = useLocation();

  useEffect(() => {
    setOpenMobile(false);
  }, [location.pathname, setOpenMobile]);

  return null;
};

const RootPage = () => {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();

  // Start real-time notification listener when user is logged in
  useEffect(() => {
    if (user?.id) {
      startNotificationListener(user.id, dispatch);
    }
    return () => {
      clearNotificationState(dispatch);
    };
  }, [user?.id, dispatch]);

  interface MenuItem {
    title: string;
    url: string;
    icon: LucideIcon;
    visible: boolean;
  }

  const mainMenuItems: MenuItem[] = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      visible: true,
    },
    {
      title: "Projects",
      url: "/projects",
      icon: FolderOpen,
      visible: user ? Permissions.canViewProjects(user.role) : false,
    },
    {
      title: "Tasks",
      url: "/tasks",
      icon: ListTodo,
      visible: user ? Permissions.canViewTasks(user.role) : false,
    },
    {
      title: "Activity",
      url: "/activity",
      icon: Activity,
      visible: user ? Permissions.canViewActivity(user.role) : false,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
      visible: user ? Permissions.canViewSettings(user.role) : false,
    },
  ];

  const adminMenuItems: MenuItem[] = [
    {
      title: "User Management",
      url: "/admin/users",
      icon: Users,
      visible: user ? Permissions.canManageUsers(user.role) : false,
    },
  ];

  const quickActionItems: MenuItem[] = [
    {
      title: "Create Project",
      url: "/projects/create",
      icon: Plus,
      visible: user ? Permissions.canCreateProjects(user.role) : false,
    },
    {
      title: "Create Task",
      url: "/tasks/create",
      icon: CheckSquare,
      visible: user ? Permissions.canCreateTasks(user.role) : false,
    },
  ];

  const visibleMain = mainMenuItems.filter((i) => i.visible);
  const visibleAdmin = adminMenuItems.filter((i) => i.visible);
  const visibleQuick = quickActionItems.filter((i) => i.visible);

  return (
    <SidebarProvider>
      <SidebarAutoClose />
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r border-border">
          <SidebarHeader>
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <FolderOpen className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <div className="font-semibold text-lg">TeamFlow</div>
                <p className="text-xs text-muted-foreground">
                  Project Management
                </p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleMain.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link to={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {visibleAdmin.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel>Administration</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {visibleAdmin.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <Link to={item.url}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {visibleQuick.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {visibleQuick.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <Link to={item.url}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>
        </Sidebar>

        <SidebarInset>
          <header className="border-b bg-background z-10">
            <nav className="flex justify-between items-center py-3 px-5">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="md:hidden" />
                <Breadcrumbs />
              </div>
              <div className="flex items-center gap-3">
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Avatar className="w-8 h-8 cursor-pointer">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                        {getInitials(user?.name || "")}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>
                      <div className="space-y-1.5">
                        <p className="text-sm font-medium">
                          {user?.name || "User"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user?.email}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${getRoleBadgeStyle(user?.role || Role.MEMBER)}`}
                          >
                            {user?.role}
                          </Badge>
                          {user?.title && (
                            <span className="text-xs text-muted-foreground">
                              {user.title}
                            </span>
                          )}
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="cursor-pointer">
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => dispatch(logoutUser())}
                    >
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </nav>
          </header>

          <main className="flex-1 p-6 bg-muted/30">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default RootPage;
