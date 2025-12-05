// components/TaskReminderSettings.js
'use client';
import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Bell, BellOff } from 'lucide-react';

export default function TaskReminderSettings() {
  const [settings, setSettings] = useState({
    emailReminders: true,
    pushNotifications: true,
    reminderTime: '09:00',
    beforeDeadline: 24, // hours
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // In a real app, fetch user's notification settings
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/user/notification-settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data.settings);
        }
      } catch (error) {
        console.error('Error fetching notification settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/notification-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (res.ok) {
        // Show success message
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Task Reminders</h3>
        <p className="text-sm text-muted-foreground">
          Configure how and when you receive task reminders
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="email-reminders" className="flex items-center">
              <Bell className="mr-2 h-4 w-4" />
              Email Reminders
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive task reminders via email
            </p>
          </div>
          <Switch
            id="email-reminders"
            checked={settings.emailReminders}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, emailReminders: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="push-notifications" className="flex items-center">
              <Bell className="mr-2 h-4 w-4" />
              Push Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive browser notifications for upcoming tasks
            </p>
          </div>
          <Switch
            id="push-notifications"
            checked={settings.pushNotifications}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, pushNotifications: checked })
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="reminder-time">Daily Reminder Time</Label>
            <input
              type="time"
              id="reminder-time"
              value={settings.reminderTime}
              onChange={(e) =>
                setSettings({ ...settings, reminderTime: e.target.value })
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="before-deadline">Remind Before Deadline</Label>
            <select
              id="before-deadline"
              value={settings.beforeDeadline}
              onChange={(e) =>
                setSettings({ ...settings, beforeDeadline: parseInt(e.target.value) })
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="1">1 hour before</option>
              <option value="3">3 hours before</option>
              <option value="6">6 hours before</option>
              <option value="12">12 hours before</option>
              <option value="24">1 day before</option>
              <option value="48">2 days before</option>
              <option value="168">1 week before</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Save Changes
        </Button>
      </div>
    </div>
  );
}