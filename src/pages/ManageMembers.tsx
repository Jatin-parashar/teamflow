import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { fetchProjects, removeProjectMember } from "@/features/projectSlice";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trash2, Users, Search, Filter } from "lucide-react";
import { Role, RequestStatus, Permissions } from "@/features/types";
import { getInitials, getRoleBadgeStyle } from "@/utils/roleUtilities";
import RoleIcon from "@/components/RoleIcon";
import { toast } from "sonner";
import LoaderIcon from "@/components/ui/loader";

const ManageMembers = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const { projects, status } = useAppSelector((state) => state.projects);
  const { user } = useAppSelector((state) => state.auth);

  const [selectedProjectId, setSelectedProjectId] = useState<string>(id || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const filteredMembers =
    selectedProject?.members?.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "all" || member.role === roleFilter;
      return matchesSearch && matchesRole;
    }) || [];

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!selectedProjectId) return;

    try {
      await dispatch(
        removeProjectMember({
          projectId: selectedProjectId,
          userId: memberId,
        })
      ).unwrap();
      toast.success(`${memberName} removed from project`);
    } catch (_error) {
      toast.error("Failed to remove member");
    }
  };

  const canManageMembers = user
    ? Permissions.canManageMembers(user.role)
    : false;

  if (status === RequestStatus.LOADING) {
    return <LoaderIcon />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900  dark:text-neutral-300">
            Manage Members
          </h1>
          <p className="text-gray-600 mt-1 dark:text-neutral-400">
            Add, remove, and manage team members for your projects
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Select Project
          </CardTitle>
          <CardDescription>
            Choose a project to manage its team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedProjectId}
            onValueChange={setSelectedProjectId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a project to manage" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{project.title}</span>
                    <Badge variant="outline" className="ml-2">
                      {project?.members?.length || 0} members
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedProject && (
        <div className="grid grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Members ({filteredMembers.length})
              </CardTitle>
              <CardDescription>
                Current members of {selectedProject.title}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
                {filteredMembers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm || roleFilter !== "all"
                      ? "No members match your search criteria"
                      : "No members found"}
                  </div>
                ) : (
                  filteredMembers.map((member) => {
                    const badgeStyle = getRoleBadgeStyle(member.role);
                    return (
                      <div
                        key={member.userId}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {getInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{member.name}</h3>
                              <RoleIcon role={member.role} />
                            </div>
                            <p className="text-sm text-gray-600">
                              {member.email}
                            </p>
                            <p className="text-xs text-gray-500">
                              Joined{" "}
                              {new Date(member.joinedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={badgeStyle}>
                            {member.role}
                          </Badge>
                          {canManageMembers && member.userId !== user?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleRemoveMember(member.userId, member.name)
                              }
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
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
      )}
    </div>
  );
};

export default ManageMembers;
