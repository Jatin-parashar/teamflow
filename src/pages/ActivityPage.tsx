import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Activity, FolderOpen, CheckSquare, Users, Search } from "lucide-react";
import { firebaseFetch } from "@/firebase/firebaseFetch";
import type { ActivityLog } from "@/firebase/activityLog";
import LoaderIcon from "@/components/ui/loader";
import { formatDate } from "@/utils/roleUtilities";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";

const ENTITY_STYLES: Record<
  ActivityLog["entityType"],
  { badge: string; icon: React.ReactNode }
> = {
  project: {
    badge:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    icon: <FolderOpen className="w-3.5 h-3.5" />,
  },
  task: {
    badge:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    icon: <CheckSquare className="w-3.5 h-3.5" />,
  },
  user: {
    badge:
      "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800",
    icon: <Users className="w-3.5 h-3.5" />,
  },
};

const ActivityPage = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await firebaseFetch<Record<
          string,
          Omit<ActivityLog, "id">
        > | null>("activity.json");
        if (data) {
          setLogs(
            Object.keys(data)
              .map((key) => ({ id: key, ...data[key] }))
              .sort(
                (a, b) =>
                  new Date(b.timestamp).getTime() -
                  new Date(a.timestamp).getTime()
              )
          );
        }
      } catch {
        /* silently fail */
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filtered = logs.filter(
    (l) =>
      !searchTerm ||
      l.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.entityName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const byType = (type: ActivityLog["entityType"]) =>
    filtered.filter((l) => l.entityType === type);

  if (loading) return <LoaderIcon />;

  const LogItem = ({ log }: { log: ActivityLog }) => {
    const style = ENTITY_STYLES[log.entityType];
    return (
      <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background hover:bg-accent/40 transition-colors">
        <div className="mt-0.5 text-muted-foreground shrink-0">
          {style.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-foreground">
              {log.userName}
            </span>
            <span className="text-sm text-muted-foreground">{log.action}</span>
            <Badge
              variant="outline"
              className={`text-xs ${style.badge} flex items-center gap-1`}
            >
              {log.entityName}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDate(log.timestamp)} ·{" "}
            {new Date(log.timestamp).toLocaleTimeString()}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Activity Feed"
        description="Track all actions across projects and tasks"
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by user, action, or entity..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 h-9 bg-background"
        />
      </div>

      <Card className="border border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Recent Activity ({filtered.length})
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <Tabs defaultValue="all">
            <TabsList className="bg-muted border border-border mb-4">
              <TabsTrigger value="all" className="gap-1.5">
                <Activity className="h-3.5 w-3.5" />
                All ({filtered.length})
              </TabsTrigger>
              <TabsTrigger value="project" className="gap-1.5">
                <FolderOpen className="h-3.5 w-3.5" />
                Projects ({byType("project").length})
              </TabsTrigger>
              <TabsTrigger value="task" className="gap-1.5">
                <CheckSquare className="h-3.5 w-3.5" />
                Tasks ({byType("task").length})
              </TabsTrigger>
              <TabsTrigger value="user" className="gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Users ({byType("user").length})
              </TabsTrigger>
            </TabsList>

            {(["all", "project", "task", "user"] as const).map((tab) => {
              const items =
                tab === "all"
                  ? filtered
                  : byType(tab as ActivityLog["entityType"]);
              return (
                <TabsContent key={tab} value={tab}>
                  <ScrollArea className="h-[480px]">
                    <div className="space-y-2 pr-3">
                      {items.length === 0 ? (
                        <EmptyState
                          icon={Activity}
                          title="No activity yet"
                          description="Actions will appear here as they happen."
                        />
                      ) : (
                        items.map((log) => <LogItem key={log.id} log={log} />)
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityPage;
