import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { useAppSelector } from "@/app/hooks";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  FolderOpen,
  ListTodo,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { getTaskStatusColor, getPriorityColor } from "@/utils/roleUtilities";
import { TaskStatus } from "@/features/types";

const statusIcon = (status: string) => {
  switch (status) {
    case TaskStatus.DONE:
      return <CheckCircle2 className="h-3 w-3 text-emerald-500" />;
    case TaskStatus.IN_PROGRESS:
      return <AlertCircle className="h-3 w-3 text-blue-500" />;
    case TaskStatus.BLOCKED:
      return <XCircle className="h-3 w-3 text-destructive" />;
    default:
      return <Clock className="h-3 w-3 text-muted-foreground" />;
  }
};

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GlobalSearch = ({ open, onOpenChange }: GlobalSearchProps) => {
  const navigate = useNavigate();
  const { tasks } = useAppSelector((s) => s.tasks);
  const { projects } = useAppSelector((s) => s.projects);
  const [query, setQuery] = useState("");

  // Reset query when dialog closes
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const q = query.trim().toLowerCase();

  const matchedTasks = q
    ? tasks
        .filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.description?.toLowerCase().includes(q) ||
            t.projectName?.toLowerCase().includes(q) ||
            t.assignedToName?.toLowerCase().includes(q)
        )
        .slice(0, 5)
    : [];

  const matchedProjects = q
    ? projects
        .filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q) ||
            p.managerName?.toLowerCase().includes(q)
        )
        .slice(0, 5)
    : [];

  const totalResults = matchedTasks.length + matchedProjects.length;
  const hasResults = totalResults > 0;

  const goTo = useCallback(
    (path: string) => {
      navigate(path);
      onOpenChange(false);
    },
    [navigate, onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden">
        <DialogTitle className="sr-only">Global Search</DialogTitle>

        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            autoFocus
            placeholder="Search tasks, projects..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 h-8 p-0 text-sm bg-transparent"
          />
          <kbd className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded border border-border bg-muted text-[10px] text-muted-foreground font-mono shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <ScrollArea className="max-h-[420px]">
          {!q ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center px-4">
              <Search className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Search across tasks and projects
              </p>
              <p className="text-xs text-muted-foreground/60">
                Type to start searching...
              </p>
            </div>
          ) : !hasResults ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center px-4">
              <Search className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">
                No results for "{query}"
              </p>
              <p className="text-xs text-muted-foreground">
                Try a different search term
              </p>
            </div>
          ) : (
            <div className="py-2">
              {/* Projects */}
              {matchedProjects.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-4 py-2">
                    <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Projects ({matchedProjects.length})
                    </span>
                  </div>
                  {matchedProjects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => goTo(`/projects/${project.id}`)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 transition-colors text-left group"
                    >
                      <div className="h-7 w-7 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0">
                        <FolderOpen className="h-3.5 w-3.5 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {project.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {project.managerName
                            ? `Manager: ${project.managerName}`
                            : project.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getPriorityColor(project.priority)}`}
                        >
                          {project.priority}
                        </Badge>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {matchedProjects.length > 0 && matchedTasks.length > 0 && (
                <Separator className="my-1" />
              )}

              {/* Tasks */}
              {matchedTasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-4 py-2">
                    <ListTodo className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Tasks ({matchedTasks.length})
                    </span>
                  </div>
                  {matchedTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => goTo(`/tasks/${task.id}`)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 transition-colors text-left group"
                    >
                      <div className="h-7 w-7 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <ListTodo className="h-3.5 w-3.5 text-emerald-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {task.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {task.projectName}
                          {task.assignedToName
                            ? ` · ${task.assignedToName}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant="outline"
                          className={`${getTaskStatusColor(task.status)} text-xs flex items-center gap-1`}
                        >
                          {statusIcon(task.status)}
                          {task.status}
                        </Badge>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {hasResults && (
          <>
            <Separator />
            <div className="flex items-center justify-between px-4 py-2">
              <p className="text-xs text-muted-foreground">
                {totalResults} result{totalResults !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded border border-border bg-muted font-mono text-[10px]">
                    ↵
                  </kbd>
                  to select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded border border-border bg-muted font-mono text-[10px]">
                    ESC
                  </kbd>
                  to close
                </span>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearch;
