import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
    <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
      <Icon className="h-7 w-7 text-muted-foreground" />
    </div>
    <div>
      <p className="font-semibold text-foreground">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      )}
    </div>
    {action && <div className="mt-1">{action}</div>}
  </div>
);

export default EmptyState;
