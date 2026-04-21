import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { fetchProjects, removeProjectMember } from "@/features/projectSlice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Trash2, Users, Search, FolderOpen } from "lucide-react";
import { Role, RequestStatus, Permissions } from "@/features/types";
import { getInitials, getRoleBadgeStyle } from "@/utils/roleUtilities";
import RoleIcon from "@/components/RoleIcon";
import { toast } from "sonner";
import LoaderIcon from "@/components/ui/loader";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";

const ManageMembers = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const { projects, status } = useAppSelector((s) => s.projects);
  const { user } = useAppSelector((s) => s.auth);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(id || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const filteredMembers =
    selectedProject?.members?.filter(
      (m) =>
        (m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (roleFilter === "all" || m.role === roleFilter)
    ) ?? [];

  const handleRemove = async (memberId: string, memberName: string) => {
    if (!selectedProjectId) return;
    try {
      await dispatch(
        removeProjectMember({ projectId: selectedProjectId, userId: memberId })
      ).unwrap();
      toast.success(`${memberName} removed from project`);
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const canManage = user ? Permissions.canManageMembers(user.role) : false;

  if (status === RequestStatus.LOADING) return <LoaderIcon />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manage Members"
        description="Add, remove, and manage team members for your projects"
      />

      {/* Project Selector */}
      <Card className="border border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            Select Project
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <Select
            value={selectedProjectId}
            onValueChange={setSelectedProjectId}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select a project to manage" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <div className="flex items-center gap-2">
                    <span>{p.title}</span>
                    <Badge variant="secondary" className="text-xs">
                      {p.members?.length ?? 0} members
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedProject && (
        <Card className="border border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                {selectedProject.title} — Members ({filteredMembers.length})
              </CardTitle>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4 space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
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

            <ScrollArea className="h-[400px]">
              <div className="space-y-2 pr-3">
                {filteredMembers.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No members found"
                    description={
                      searchTerm || roleFilter !== "all"
                        ? "Try adjusting your search"
                        : "No members in this project yet"
                    }
                  />
                ) : (
                  filteredMembers.map((member) => (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-background hover:bg-accent/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">
                              {member.name}
                            </p>
                            <RoleIcon role={member.role} />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {member.email}
                          </p>
                          <p className="text-xs text-muted-foreground/70">
                            Joined{" "}
                            {new Date(member.joinedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`${getRoleBadgeStyle(member.role)} text-xs`}
                        >
                          {member.role}
                        </Badge>
                        {canManage && member.userId !== user?.id && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Remove Member
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Remove {member.name} from{" "}
                                  {selectedProject.title}? They will lose access
                                  to all project tasks.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleRemove(member.userId, member.name)
                                  }
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ManageMembers;
