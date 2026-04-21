import { useAppSelector } from "@/app/hooks";
import AdminDashboard from "@/components/Dashboard/AdminDashboard";
import ProjectManagerDashboard from "@/components/Dashboard/ProjectManagerDashboard";
import TeamMemberDashboard from "@/components/Dashboard/TeamMember";
import { Role, hasMinRole } from "@/features/types";

const Dashboard = () => {
  const role = useAppSelector((state) => state.auth.user?.role);

  const renderDashboard = () => {
    if (!role) return <TeamMemberDashboard />;
    if (hasMinRole(role, Role.ADMIN)) return <AdminDashboard />;
    if (hasMinRole(role, Role.MANAGER)) return <ProjectManagerDashboard />;
    return <TeamMemberDashboard />;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Welcome to TeamFlow</h1>
      <div>{renderDashboard()}</div>
    </div>
  );
};

export default Dashboard;
