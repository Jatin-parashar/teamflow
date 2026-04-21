import type { Role } from "@/features/types";
import { getRoleIcon } from "@/utils/roleUtilities";
import type { FC } from "react";

const RoleIcon: FC<{ role: Role }> = ({ role }) => {
  const Icon = getRoleIcon(role);
  return <Icon className="w-4 h-4 text-muted-foreground" />;
};

export default RoleIcon;
