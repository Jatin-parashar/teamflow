import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/context/ThemeProvider";
import { Priority } from "@/features/types";
import { useAppSelector } from "@/app/hooks";
import { firebaseFetch } from "@/firebase/firebaseFetch";
import { toast } from "sonner";
import LoaderIcon from "@/components/ui/loader";

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

const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const { user } = useAppSelector((state) => state.auth);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const loadSettings = async () => {
      try {
        const data = await firebaseFetch<UserSettings | null>(
          `settings/${user.id}.json`
        );
        if (data) setSettings(data);
      } catch {
        // Use defaults silently
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
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

  const toggleTheme = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
  };

  if (loading) return <LoaderIcon />;

  return (
    <div className="flex flex-col space-y-6 max-w-4xl mx-auto p-6">
      <h2 className="font-semibold text-3xl mb-6">Settings</h2>
      <div className="space-y-4">
        <h3 className="text-xl font-medium text-muted-foreground">
          Appearance
        </h3>
        <div className="p-6 flex items-center justify-between border shadow-lg rounded-xl bg-card text-card-foreground">
          <div>
            <Label htmlFor="darkMode" className="text-lg font-medium">
              Dark Mode
            </Label>
            <p className="text-sm text-muted-foreground">
              Switch between light and dark themes
            </p>
          </div>
          <Switch
            id="darkMode"
            checked={theme === "dark"}
            onCheckedChange={toggleTheme}
          />
        </div>

        <div className="p-6 flex items-center justify-between border shadow-lg rounded-xl bg-card text-card-foreground">
          <div>
            <Label htmlFor="showWeekends" className="text-lg font-medium">
              Show Weekends
            </Label>
            <p className="text-sm text-muted-foreground">
              Display weekends in calendar and timeline views
            </p>
          </div>
          <Switch
            id="showWeekends"
            checked={settings.showWeekends}
            onCheckedChange={(v) => updateSetting("showWeekends", v)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-medium text-muted-foreground">
          Notifications
        </h3>
        <div className="p-6 flex items-center justify-between border shadow-lg rounded-xl bg-card text-card-foreground">
          <div>
            <Label htmlFor="emailNotifications" className="text-lg font-medium">
              Email Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive email updates for important events
            </p>
          </div>
          <Switch
            id="emailNotifications"
            checked={settings.emailNotifications}
            onCheckedChange={(v) => updateSetting("emailNotifications", v)}
          />
        </div>

        <div className="p-6 flex items-center justify-between border shadow-lg rounded-xl bg-card text-card-foreground">
          <div>
            <Label htmlFor="taskReminders" className="text-lg font-medium">
              Task Reminder Alerts
            </Label>
            <p className="text-sm text-muted-foreground">
              Get notified about upcoming task deadlines
            </p>
          </div>
          <Switch
            id="taskReminders"
            checked={settings.taskReminders}
            onCheckedChange={(v) => updateSetting("taskReminders", v)}
          />
        </div>

        <div className="p-6 flex items-center justify-between border shadow-lg rounded-xl bg-card text-card-foreground">
          <div>
            <Label htmlFor="projectUpdates" className="text-lg font-medium">
              Project Status Updates
            </Label>
            <p className="text-sm text-muted-foreground">
              Notifications when project milestones are reached
            </p>
          </div>
          <Switch
            id="projectUpdates"
            checked={settings.projectUpdates}
            onCheckedChange={(v) => updateSetting("projectUpdates", v)}
          />
        </div>

        <div className="p-6 flex items-center justify-between border shadow-lg rounded-xl bg-card text-card-foreground">
          <div>
            <Label htmlFor="weeklyDigest" className="text-lg font-medium">
              Weekly Progress Digest
            </Label>
            <p className="text-sm text-muted-foreground">
              Weekly summary of completed tasks and upcoming deadlines
            </p>
          </div>
          <Switch
            id="weeklyDigest"
            checked={settings.weeklyDigest}
            onCheckedChange={(v) => updateSetting("weeklyDigest", v)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-medium text-muted-foreground">
          Project Management
        </h3>
        <div className="p-6 flex items-center justify-between border shadow-lg rounded-xl bg-card text-card-foreground">
          <div>
            <Label htmlFor="autoAssignTasks" className="text-lg font-medium">
              Auto-assign Tasks
            </Label>
            <p className="text-sm text-muted-foreground">
              Automatically assign tasks based on team member availability
            </p>
          </div>
          <Switch
            id="autoAssignTasks"
            checked={settings.autoAssignTasks}
            onCheckedChange={(v) => updateSetting("autoAssignTasks", v)}
          />
        </div>

        <div className="p-6 flex items-center justify-between border shadow-lg rounded-xl bg-card text-card-foreground">
          <div>
            <Label htmlFor="defaultView" className="text-lg font-medium">
              Default Project View
            </Label>
            <p className="text-sm text-muted-foreground">
              Choose your preferred view when opening projects
            </p>
          </div>
          <Select
            value={settings.defaultView}
            onValueChange={(v) => updateSetting("defaultView", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kanban">Kanban Board</SelectItem>
              <SelectItem value="list">List View</SelectItem>
              <SelectItem value="calendar">Calendar</SelectItem>
              <SelectItem value="timeline">Timeline</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="p-6 flex items-center justify-between border shadow-lg rounded-xl bg-card text-card-foreground">
          <div>
            <Label htmlFor="taskPriority" className="text-lg font-medium">
              Task Priority System
            </Label>
            <p className="text-sm text-muted-foreground">
              Default priority levels for new tasks
            </p>
          </div>
          <Select
            value={settings.defaultPriority}
            onValueChange={(v) => updateSetting("defaultPriority", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={Priority.LOW}>Low Priority</SelectItem>
              <SelectItem value={Priority.MEDIUM}>Medium Priority</SelectItem>
              <SelectItem value={Priority.HIGH}>High Priority</SelectItem>
              <SelectItem value={Priority.CRITICAL}>Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-medium text-muted-foreground">Account</h3>
        <div className="p-6 flex items-center justify-between border shadow-lg rounded-xl bg-card text-card-foreground">
          <div>
            <Label htmlFor="changePassword" className="text-lg font-medium">
              Change Password
            </Label>
            <p className="text-sm text-muted-foreground">
              Update your account password
            </p>
          </div>
          <button
            id="changePassword"
            className="text-black text-sm dark:text-white hover:underline font-medium px-4 py-2 rounded-md transition-colors"
          >
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
