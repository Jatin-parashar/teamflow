import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { markAllRead, markOneRead } from "@/features/notificationSlice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, FolderOpen, CheckSquare, Users, CheckCheck } from "lucide-react";
import { formatDate } from "@/utils/roleUtilities";
import type { Notification } from "@/features/notificationSlice";

const entityIcon = (type: Notification["entityType"]) => {
  switch (type) {
    case "project":
      return <FolderOpen className="h-3.5 w-3.5 text-blue-500 shrink-0" />;
    case "task":
      return <CheckSquare className="h-3.5 w-3.5 text-emerald-500 shrink-0" />;
    case "user":
      return <Users className="h-3.5 w-3.5 text-violet-500 shrink-0" />;
  }
};

const NotificationBell = () => {
  const dispatch = useAppDispatch();
  const { notifications, unreadCount } = useAppSelector((s) => s.notifications);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              Notifications
            </span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
              onClick={() => dispatch(markAllRead())}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        <Separator />

        {/* List */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-center px-4">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">All caught up</p>
            <p className="text-xs text-muted-foreground">No activity yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[360px]">
            <div className="py-1">
              {notifications.map((n, i) => (
                <div key={n.id}>
                  <button
                    onClick={() => dispatch(markOneRead(n.id))}
                    className={`w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors flex items-start gap-3 ${
                      !n.read ? "bg-primary/5" : ""
                    }`}
                  >
                    {/* Unread dot */}
                    <div className="mt-1 shrink-0">
                      {!n.read ? (
                        <span className="block h-2 w-2 rounded-full bg-primary" />
                      ) : (
                        <span className="block h-2 w-2 rounded-full bg-transparent" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {entityIcon(n.entityType)}
                        <span className="text-xs font-medium text-foreground">
                          {n.userName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {n.action}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-foreground truncate">
                        {n.entityName}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDate(n.timestamp)} ·{" "}
                        {new Date(n.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </button>
                  {i < notifications.length - 1 && (
                    <Separator className="opacity-50" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
