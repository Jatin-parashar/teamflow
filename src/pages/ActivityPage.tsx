import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, FolderOpen, CheckSquare, Users } from "lucide-react";
import { firebaseFetch } from "@/firebase/firebaseFetch";
import type { ActivityLog } from "@/firebase/activityLog";
import LoaderIcon from "@/components/ui/loader";
import { formatDate } from "@/utils/roleUtilities";

const ActivityPage = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await firebaseFetch<Record<string, Omit<ActivityLog, "id">> | null>(
          "activity.json"
        );
        if (data) {
          const sorted = Object.keys(data)
            .map((key) => ({ id: key, ...data[key] }))
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setLogs(sorted);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const getEntityIcon = (type: ActivityLog["entityType"]) => {
    switch (type) {
      case "project": return <FolderOpen className="w-4 h-4" />;
      case "task": return <CheckSquare className="w-4 h-4" />;
      case "user": return <Users className="w-4 h-4" />;
    }
  };

  const getEntityBadgeStyle = (type: ActivityLog["entityType"]) => {
    switch (type) {
      case "project": return "bg-blue-50 text-blue-700 border-blue-200";
      case "task": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "user": return "bg-violet-50 text-violet-700 border-violet-200";
    }
  };

  if (loading) return <LoaderIcon />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Activity className="w-7 h-7" />
          Activity Feed
        </h1>
        <p className="text-muted-foreground mt-1">
          Track all actions across projects and tasks
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity ({logs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p>No activity recorded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="mt-0.5 text-muted-foreground">
                    {getEntityIcon(log.entityType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{log.userName}</span>
                      <span className="text-sm text-muted-foreground">{log.action}</span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getEntityBadgeStyle(log.entityType)}`}
                      >
                        {log.entityName}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(log.timestamp)} · {new Date(log.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityPage;
