import { useEffect, useState } from "react";
import { useAppSelector } from "@/app/hooks";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserCog, Users, Search, AlertCircle } from "lucide-react";
import { Role, type User, Permissions } from "@/features/types";
import {
  getInitials,
  getRoleIcon,
  getRoleBadgeStyle,
} from "@/utils/roleUtilities";
import { toast } from "sonner";
import LoaderIcon from "@/components/ui/loader";
import { firebaseFetch } from "@/firebase/firebaseFetch";

const UserManagement = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await firebaseFetch<Record<
          string,
          Omit<User, "id">
        > | null>("users.json");

        if (data) {
          const usersList: User[] = Object.keys(data).map((key) => ({
            id: key,
            name: data[key].name,
            email: data[key].email,
            role: data[key].role,
            title: data[key].title || "",
          }));
          setUsers(usersList);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter((userData) => {
    const matchesSearch =
      userData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userData.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || userData.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = async (userId: string, newRole: Role) => {
    const userBeingUpdated = users.find((u) => u.id === userId);
    const previousRole = userBeingUpdated?.role;

    try {
      await firebaseFetch(`users/${userId}.json`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });

      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );

      if (previousRole === Role.MANAGER && newRole !== Role.MANAGER) {
        const projectsData = await firebaseFetch<Record<string, any> | null>(
          "projects.json"
        );

        if (projectsData) {
          const projectUpdates: Record<string, any> = {};
          Object.keys(projectsData)
            .filter((pid) => projectsData[pid].managerId === userId)
            .forEach((pid) => {
              projectUpdates[`/projects/${pid}/managerId`] = "";
              projectUpdates[`/projects/${pid}/managerName`] = "";
              projectUpdates[`/projects/${pid}/updatedAt`] =
                new Date().toISOString();
            });

          if (Object.keys(projectUpdates).length > 0) {
            await firebaseFetch(".json", {
              method: "PATCH",
              body: JSON.stringify(projectUpdates),
            });
          }
        }
      }

      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      if (previousRole) {
        await firebaseFetch(`users/${userId}.json`, {
          method: "PATCH",
          body: JSON.stringify({ role: previousRole }),
        }).catch(() => {});
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.id === userId ? { ...u, role: previousRole } : u
          )
        );
      }
      console.error("Failed to update user role:", error);
      toast.error("Failed to update user role. Changes have been reverted.");
    }
  };

  const roleStats = {
    total: users.length,
    admin: users.filter((u) => u.role === Role.ADMIN || u.role === Role.OWNER)
      .length,
    manager: users.filter((u) => u.role === Role.MANAGER).length,
    member: users.filter((u) => u.role === Role.MEMBER).length,
    guest: users.filter((u) => u.role === Role.GUEST).length,
  };

  // Check if current user is admin
  if (!user || !Permissions.canManageUsers(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoaderIcon />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <UserCog className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-neutral-200">
            User Management
          </h1>
          <p className="text-gray-600 mt-1 dark:text-neutral-400">
            Manage users, roles, and permissions
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-400">
              {roleStats.total}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400">
              Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {roleStats.admin}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400">
              Managers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {roleStats.manager}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400">
              Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {roleStats.member}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Directory
          </CardTitle>
          <CardDescription>Manage user roles and permissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value={Role.OWNER}>Owner</SelectItem>
                <SelectItem value={Role.ADMIN}>Admin</SelectItem>
                <SelectItem value={Role.MANAGER}>Manager</SelectItem>
                <SelectItem value={Role.MEMBER}>Member</SelectItem>
                <SelectItem value={Role.GUEST}>Guest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || roleFilter !== "all"
                  ? "No users match your search criteria"
                  : "No users found"}
              </div>
            ) : (
              filteredUsers.map((userData) => {
                const badgeStyle = getRoleBadgeStyle(userData.role);
                const RoleIconComponent = getRoleIcon(userData.role);
                const isCurrentUser = userData.id === user?.id;

                return (
                  <div
                    key={userData.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {getInitials(userData.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">
                            {userData.name}
                            {isCurrentUser && (
                              <span className="text-xs text-gray-500 ml-2">
                                (You)
                              </span>
                            )}
                          </h3>
                          <RoleIconComponent className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {userData.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={badgeStyle}>
                        {userData.role}
                      </Badge>

                      {!isCurrentUser &&
                        !Permissions.canManageUsers(userData.role) && (
                          <Select
                            value={userData.role}
                            onValueChange={(newRole) =>
                              handleRoleChange(userData.id, newRole as Role)
                            }
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={Role.MEMBER}>
                                Member
                              </SelectItem>
                              <SelectItem value={Role.MANAGER}>
                                Manager
                              </SelectItem>
                              <SelectItem value={Role.GUEST}>Guest</SelectItem>
                              {Permissions.canManageUsers(
                                user?.role || Role.GUEST
                              ) && (
                                <SelectItem value={Role.ADMIN}>
                                  Admin
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
