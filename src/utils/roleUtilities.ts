import { Priority, ProjectStatus, Role, TaskStatus } from "@/features/types";
import { Crown, ShieldCheck, Briefcase, User, Eye, XCircle, PlayCircle, CheckCircle, PauseCircle, Clock, AlertCircle } from "lucide-react";

export const getRoleIcon = (role: Role) => {
    switch (role) {
        case Role.OWNER:
            return Crown;
        case Role.ADMIN:
            return ShieldCheck;
        case Role.MANAGER:
            return Briefcase;
        case Role.GUEST:
            return Eye;
        case Role.MEMBER:
        default:
            return User;
    }
};

export const getRoleBadgeStyle = (role: Role) => {
    switch (role) {
        case Role.OWNER:
            return "bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800";
        case Role.ADMIN:
            return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
        case Role.MANAGER:
            return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800";
        case Role.MEMBER:
            return "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700";
        case Role.GUEST:
            return "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700";
        default:
            return "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700";
    }
};

export const getProjectStatusIcon = (projectStatus: ProjectStatus) => {
    switch (projectStatus) {
        case ProjectStatus.NOT_STARTED:
            return XCircle;
        case ProjectStatus.IN_PROGRESS:
            return PlayCircle;
        case ProjectStatus.COMPLETED:
            return CheckCircle;
        case ProjectStatus.ON_HOLD:
            return PauseCircle;
        default:
            return Clock;
    }
};

export const getTaskStatusIcon = (taskStatus: TaskStatus) => {
    switch (taskStatus) {
        case TaskStatus.TO_DO:
            return Clock;
        case TaskStatus.IN_PROGRESS:
            return AlertCircle;
        case TaskStatus.DONE:
            return CheckCircle;
        case TaskStatus.BLOCKED:
            return XCircle;
        default:
            return Clock;
    }
};

export const getInitials = (name: string) => {
    return name.split(" ").map((word) => word[0]).join("").toUpperCase();
};

export const formatDate = (dateString: string) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

export const getProjectStatusColor = (status: string) => {
    switch (status) {
        case ProjectStatus.NOT_STARTED:
            return "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600";
        case ProjectStatus.IN_PROGRESS:
            return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
        case ProjectStatus.COMPLETED:
            return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800";
        case ProjectStatus.ON_HOLD:
            return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800";
        default:
            return "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600";
    }
};

export const getTaskStatusColor = (status: string) => {
    switch (status) {
        case TaskStatus.TO_DO:
            return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600";
        case TaskStatus.IN_PROGRESS:
            return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
        case TaskStatus.DONE:
            return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800";
        case TaskStatus.BLOCKED:
            return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
        default:
            return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600";
    }
};

export const getPriorityColor = (priority: string) => {
    switch (priority) {
        case Priority.LOW:
            return "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600";
        case Priority.MEDIUM:
            return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800";
        case Priority.HIGH:
            return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800";
        case Priority.CRITICAL:
            return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
        default:
            return "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600";
    }
};
