export const Role = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MANAGER: "Manager",
  MEMBER: "Member",
  GUEST: "Guest",
} as const;
export type Role = typeof Role[keyof typeof Role];

export const RequestStatus = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
} as const;
export type RequestStatus = typeof RequestStatus[keyof typeof RequestStatus];

export const ProjectStatus = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  ON_HOLD: 'On Hold',
} as const;
export type ProjectStatus = typeof ProjectStatus[keyof typeof ProjectStatus];

export const TaskStatus = {
  TO_DO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
  BLOCKED: 'Blocked',
} as const;
export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];

export const Priority = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
} as const;
export type Priority = typeof Priority[keyof typeof Priority];

export type ProjectPriority = Priority;
export type TaskPriority = Priority;

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
}

// Permissions system
const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.OWNER]: 5,
  [Role.ADMIN]: 4,
  [Role.MANAGER]: 3,
  [Role.MEMBER]: 2,
  [Role.GUEST]: 1,
};

export const hasMinRole = (userRole: Role, minRole: Role): boolean => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
};

export const Permissions = {
  canManageUsers: (role: Role) => hasMinRole(role, Role.ADMIN),
  canCreateProjects: (role: Role) => hasMinRole(role, Role.ADMIN),
  canEditProject: (role: Role) => hasMinRole(role, Role.MANAGER),
  canDeleteProjects: (role: Role) => hasMinRole(role, Role.ADMIN),
  canCreateTasks: (role: Role) => hasMinRole(role, Role.MANAGER),
  canEditTasks: (role: Role) => hasMinRole(role, Role.MANAGER),
  canDeleteTasks: (role: Role) => hasMinRole(role, Role.MANAGER),
  canUpdateTaskStatus: (role: Role) => hasMinRole(role, Role.MEMBER),
  canManageMembers: (role: Role) => hasMinRole(role, Role.ADMIN),
  canViewProjects: (role: Role) => hasMinRole(role, Role.GUEST),
  canViewTasks: (role: Role) => hasMinRole(role, Role.GUEST),
  canComment: (role: Role) => hasMinRole(role, Role.GUEST),
  canUploadFiles: (role: Role) => hasMinRole(role, Role.MEMBER),
  canExportData: (role: Role) => hasMinRole(role, Role.MANAGER),
  canViewActivity: (role: Role) => hasMinRole(role, Role.MANAGER),
  canViewSettings: (role: Role) => hasMinRole(role, Role.MEMBER),
} as const;
