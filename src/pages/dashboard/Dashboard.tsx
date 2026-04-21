import { useAppSelector } from "@/app/hooks";
import AdminDashboard from "@/components/Dashboard/AdminDashboard";
import ProjectManagerDashboard from "@/components/Dashboard/ProjectManagerDashboard";
import TeamMemberDashboard from "@/components/Dashboard/TeamMember";
import { Role, hasMinRole } from "@/features/types";

const Dashboard = () => {
  const user = useAppSelector((state) => state.auth.user);
  const role = user?.role;

  const renderDashboard = () => {
    if (!role) return <TeamMemberDashboard />;
    if (hasMinRole(role, Role.ADMIN)) return <AdminDashboard />;
    if (hasMinRole(role, Role.MANAGER)) return <ProjectManagerDashboard />;
    return <TeamMemberDashboard />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back, {user?.name?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Here's what's happening across your projects today.
        </p>
      </div>
      {renderDashboard()}
    </div>
  );
};

export default Dashboard;
