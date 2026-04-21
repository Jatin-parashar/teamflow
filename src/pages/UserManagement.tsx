import { useEffect, useState } from "react";
import { useAppSelector } from "@/app/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Search,
  ShieldAlert,
  Crown,
  Briefcase,
  User,
} from "lucide-react";
import { Role, type User, Permissions } from "@/features/types";
import {
  getInitials,
  getRoleIcon,
  getRoleBadgeStyle,
} from "@/utils/roleUtilities";
import { toast } from "sonner";
import LoaderIcon from "@/components/ui/loader";
import { firebaseFetch } from "@/firebase/firebaseFetch";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";

const UserManagement = () => {
  const { user } = useAppSelector((s) => s.auth);
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
          setUsers(
            Object.keys(data).map((key) => ({
              id: key,
              name: data[key].name,
              email: data[key].email,
              role: data[key].role,
              title: data[key].title || "",
            }))
          );
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

  const filteredUsers = users.filter(
    (u) =>
      (u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (roleFilter === "all" || u.role === roleFilter)
  );

  const handleRoleChange = async (userId: string, newRole: Role) => {
    const prev = users.find((u) => u.id === userId)?.role;
    try {
      await firebaseFetch(`users/${userId}.json`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );

      if (prev === Role.MANAGER && newRole !== Role.MANAGER) {
        const projectsData = await firebaseFetch<Record<
          string,
          Record<string, string>
        > | null>("projects.json");
        if (projectsData) {
          const updates: Record<string, string> = {};
          Object.keys(projectsData)
            .filter((pid) => projectsData[pid].managerId === userId)
            .forEach((pid) => {
              updates[`/projects/${pid}/managerId`] = "";
              updates[`/projects/${pid}/managerName`] = "";
              updates[`/projects/${pid}/updatedAt`] = new Date().toISOString();
            });
          if (Object.keys(updates).length > 0)
            await firebaseFetch(".json", {
              method: "PATCH",
              body: JSON.stringify(updates),
            });
        }
      }
      toast.success(`Role updated to ${newRole}`);
    } catch (error) {
      if (prev) {
        await firebaseFetch(`users/${userId}.json`, {
          method: "PATCH",
          body: JSON.stringify({ role: prev }),
        }).catch(() => {});
        setUsers((u) =>
          u.map((x) => (x.id === userId ? { ...x, role: prev } : x))
        );
      }
      console.error("Failed to update user role:", error);
      toast.error("Failed to update role. Changes reverted.");
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

  if (!user || !Permissions.canManageUsers(user.role)) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert variant="destructive" className="max-w-md">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) return <LoaderIcon />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage users, roles, and permissions"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Users"
          value={roleStats.total}
          icon={Users}
          iconClass="text-primary"
          valueClass="text-foreground"
        />
        <StatCard
          label="Admins & Owners"
          value={roleStats.admin}
          icon={Crown}
          iconClass="text-violet-500"
          valueClass="text-violet-600"
        />
        <StatCard
          label="Managers"
          value={roleStats.manager}
          icon={Briefcase}
          iconClass="text-emerald-500"
          valueClass="text-emerald-600"
        />
        <StatCard
          label="Members"
          value={roleStats.member}
          icon={User}
          iconClass="text-blue-500"
          valueClass="text-blue-600"
        />
      </div>

      <Card className="border border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            User Directory
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 bg-background"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-44 h-9 bg-background">
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

          {/* Tabs by role */}
          <Tabs defaultValue="all">
            <TabsList className="bg-muted border border-border">
              <TabsTrigger value="all">All ({users.length})</TabsTrigger>
              <TabsTrigger value="admin">
                Admins ({roleStats.admin})
              </TabsTrigger>
              <TabsTrigger value="manager">
                Managers ({roleStats.manager})
              </TabsTrigger>
              <TabsTrigger value="member">
                Members ({roleStats.member})
              </TabsTrigger>
            </TabsList>

            {["all", "admin", "manager", "member"].map((tab) => {
              const tabUsers = filteredUsers.filter((u) => {
                if (tab === "all") return true;
                if (tab === "admin")
                  return u.role === Role.ADMIN || u.role === Role.OWNER;
                if (tab === "manager") return u.role === Role.MANAGER;
                return u.role === Role.MEMBER || u.role === Role.GUEST;
              });

              return (
                <TabsContent key={tab} value={tab} className="mt-3">
                  <ScrollArea className="h-[420px]">
                    <div className="space-y-2 pr-3">
                      {tabUsers.length === 0 ? (
                        <EmptyState
                          icon={Users}
                          title="No users found"
                          description={
                            searchTerm
                              ? "Try adjusting your search"
                              : "No users in this category"
                          }
                        />
                      ) : (
                        tabUsers.map((userData) => {
                          const RoleIconComponent = getRoleIcon(userData.role);
                          const isCurrentUser = userData.id === user?.id;
                          return (
                            <div
                              key={userData.id}
                              className="flex items-center justify-between p-3 rounded-lg border border-border bg-background hover:bg-accent/40 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                    {getInitials(userData.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-foreground">
                                      {userData.name}
                                    </p>
                                    {isCurrentUser && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs h-4 px-1"
                                      >
                                        You
                                      </Badge>
                                    )}
                                    <RoleIconComponent className="h-3.5 w-3.5 text-muted-foreground" />
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {userData.email}
                                  </p>
                                  {userData.title && (
                                    <p className="text-xs text-muted-foreground/70">
                                      {userData.title}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={`${getRoleBadgeStyle(userData.role)} text-xs`}
                                >
                                  {userData.role}
                                </Badge>
                                {!isCurrentUser &&
                                  !Permissions.canManageUsers(
                                    userData.role
                                  ) && (
                                    <Select
                                      value={userData.role}
                                      onValueChange={(r) =>
                                        handleRoleChange(userData.id, r as Role)
                                      }
                                    >
                                      <SelectTrigger className="w-32 h-7 text-xs bg-background">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value={Role.GUEST}>
                                          Guest
                                        </SelectItem>
                                        <SelectItem value={Role.MEMBER}>
                                          Member
                                        </SelectItem>
                                        <SelectItem value={Role.MANAGER}>
                                          Manager
                                        </SelectItem>
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
                  </ScrollArea>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
