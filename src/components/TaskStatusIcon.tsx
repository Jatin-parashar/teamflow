import type { TaskStatus } from "@/features/types";
import { getTaskStatusIcon } from "@/utils/roleUtilities";
import type { FC } from "react";

const TaskStatusIcon: FC<{ taskStatus: TaskStatus }> = ({ taskStatus }) => {
  const Icon = getTaskStatusIcon(taskStatus);
  return <Icon className="w-4 h-4" />;
};

export default TaskStatusIcon;
