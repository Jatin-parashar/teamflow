import type { ProjectStatus } from "@/features/types";
import { getProjectStatusIcon } from "@/utils/roleUtilities";
import type { FC } from "react";

const ProjectStatusIcon: FC<{ projectStatus: ProjectStatus }> = ({
  projectStatus,
}) => {
  const Icon = getProjectStatusIcon(projectStatus);
  return <Icon className="w-4 h-4" />;
};

export default ProjectStatusIcon;
