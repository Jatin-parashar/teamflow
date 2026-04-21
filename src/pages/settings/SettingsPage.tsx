import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "@/context/ThemeProvider";
import { Priority } from "@/features/types";
import { useAppSelector } from "@/app/hooks";
import { firebaseFetch } from "@/firebase/firebaseFetch";
import { toast } from "sonner";
import LoaderIcon from "@/components/ui/loader";
import PageHeader from "@/components/PageHeader";
import { Moon, Bell, User, LayoutGrid } from "lucide-react";

interface UserSettings {
  emailNotifications: boolean;
  taskReminders: boolean;
  weeklyDigest: boolean;
  projectUpdates: boolean;
  autoAssignTasks: boolean;
  showWeekends: boolean;
  defaultView: string;
  defaultPriority: string;
}

const defaultSettings: UserSettings = {
  emailNotifications: true,
  taskReminders: true,
  weeklyDigest: false,
  projectUpdates: true,
  autoAssignTasks: false,
  showWeekends: false,
  defaultView: "kanban",
  defaultPriority: Priority.MEDIUM,
};

interface SettingRowProps {
  id: string;
  label: string;
  description: string;
  children: React.ReactNode;
}

const SettingRow = ({ id, label, description, children }: SettingRowProps) => (
  <div className="flex items-center justify-between gap-4 py-4">
    <div className="flex-1">
      <Label
        htmlFor={id}
        className="text-sm font-medium text-foreground cursor-pointer"
      >
        {label}
      </Label>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </div>
    {children}
  </div>
);

const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const { user } = useAppSelector((s) => s.auth);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const data = await firebaseFetch<UserSettings | null>(
          `settings/${user.id}.json`
        );
        if (data) setSettings(data);
      } catch {
        /* use defaults */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const updateSetting = async <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    if (!user) return;
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    try {
      await firebaseFetch(`settings/${user.id}.json`, {
        method: "PUT",
        body: JSON.stringify(updated),
      });
    } catch {
      toast.error("Failed to save setting");
      setSettings(settings);
    }
  };

  if (loading) return <LoaderIcon />;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title="Settings"
        description="Manage your preferences and account settings"
      />

      <Tabs defaultValue="appearance">
        <TabsList className="bg-muted border border-border">
          <TabsTrigger value="appearance" className="gap-1.5">
            <Moon className="h-3.5 w-3.5" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5">
            <Bell className="h-3.5 w-3.5" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="workspace" className="gap-1.5">
            <LayoutGrid className="h-3.5 w-3.5" />
            Workspace
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-1.5">
            <User className="h-3.5 w-3.5" />
            Account
          </TabsTrigger>
        </TabsList>

        {/* Appearance */}
        <TabsContent value="appearance" className="mt-4">
          <Card className="border border-border bg-card">
            <CardContent className="p-4 divide-y divide-border">
              <SettingRow
                id="darkMode"
                label="Dark Mode"
                description="Switch between light and dark themes"
              >
                <Switch
                  id="darkMode"
                  checked={theme === "dark"}
                  onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
                />
              </SettingRow>
              <SettingRow
                id="showWeekends"
                label="Show Weekends"
                description="Display weekends in calendar and timeline views"
              >
                <Switch
                  id="showWeekends"
                  checked={settings.showWeekends}
                  onCheckedChange={(v) => updateSetting("showWeekends", v)}
                />
              </SettingRow>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="mt-4">
          <Card className="border border-border bg-card">
            <CardContent className="p-4 divide-y divide-border">
              <SettingRow
                id="emailNotifications"
                label="Email Notifications"
                description="Receive email updates for important events"
              >
                <Switch
                  id="emailNotifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(v) =>
                    updateSetting("emailNotifications", v)
                  }
                />
              </SettingRow>
              <SettingRow
                id="taskReminders"
                label="Task Reminder Alerts"
                description="Get notified about upcoming task deadlines"
              >
                <Switch
                  id="taskReminders"
                  checked={settings.taskReminders}
                  onCheckedChange={(v) => updateSetting("taskReminders", v)}
                />
              </SettingRow>
              <SettingRow
                id="projectUpdates"
                label="Project Status Updates"
                description="Notifications when project milestones are reached"
              >
                <Switch
                  id="projectUpdates"
                  checked={settings.projectUpdates}
                  onCheckedChange={(v) => updateSetting("projectUpdates", v)}
                />
              </SettingRow>
              <SettingRow
                id="weeklyDigest"
                label="Weekly Progress Digest"
                description="Weekly summary of completed tasks and upcoming deadlines"
              >
                <Switch
                  id="weeklyDigest"
                  checked={settings.weeklyDigest}
                  onCheckedChange={(v) => updateSetting("weeklyDigest", v)}
                />
              </SettingRow>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workspace */}
        <TabsContent value="workspace" className="mt-4">
          <Card className="border border-border bg-card">
            <CardContent className="p-4 divide-y divide-border">
              <SettingRow
                id="autoAssignTasks"
                label="Auto-assign Tasks"
                description="Automatically assign tasks based on team member availability"
              >
                <Switch
                  id="autoAssignTasks"
                  checked={settings.autoAssignTasks}
                  onCheckedChange={(v) => updateSetting("autoAssignTasks", v)}
                />
              </SettingRow>
              <SettingRow
                id="defaultView"
                label="Default Project View"
                description="Choose your preferred view when opening projects"
              >
                <Select
                  value={settings.defaultView}
                  onValueChange={(v) => updateSetting("defaultView", v)}
                >
                  <SelectTrigger className="w-40 h-8 text-sm bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kanban">Kanban Board</SelectItem>
                    <SelectItem value="list">List View</SelectItem>
                    <SelectItem value="calendar">Calendar</SelectItem>
                    <SelectItem value="timeline">Timeline</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
              <SettingRow
                id="defaultPriority"
                label="Default Task Priority"
                description="Default priority level for new tasks"
              >
                <Select
                  value={settings.defaultPriority}
                  onValueChange={(v) => updateSetting("defaultPriority", v)}
                >
                  <SelectTrigger className="w-40 h-8 text-sm bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Priority.LOW}>Low</SelectItem>
                    <SelectItem value={Priority.MEDIUM}>Medium</SelectItem>
                    <SelectItem value={Priority.HIGH}>High</SelectItem>
                    <SelectItem value={Priority.CRITICAL}>Critical</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account */}
        <TabsContent value="account" className="mt-4">
          <Card className="border border-border bg-card">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Email Address
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {user?.email}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">Read-only</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Role</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {user?.title || user?.role}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  Managed by admin
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Change Password
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Update your account password
                  </p>
                </div>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
