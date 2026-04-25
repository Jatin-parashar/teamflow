import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  iconClass?: string;
  valueClass?: string;
}

const StatCard = ({
  label,
  value,
  icon: Icon,
  iconClass = "text-muted-foreground",
  valueClass = "text-foreground",
}: StatCardProps) => (
  <Card className="bg-card">
    <CardContent className="p-4">
      <div className={`flex items-center gap-2 mb-1 ${iconClass}`}>
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
      </div>
      <p className={`text-2xl font-bold tabular-nums ${valueClass}`}>{value}</p>
    </CardContent>
  </Card>
);

export default StatCard;
