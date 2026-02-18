import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface SettingsPanelProps {
  onClose: () => void;
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<"notifications" | "invites">(
    "notifications"
  );
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteRole, setInviteRole] = useState<"client" | "therapist">(
    "therapist"
  );

  const { data: settings } = trpc.notifications.getSettings.useQuery();
  const updateSettings = trpc.notifications.updateSettings.useMutation();
  const createInvite = trpc.relationship.createInvite.useMutation({
    onSuccess: (data) => {
      // In a real app, you'd generate the actual link
      setInviteLink(`https://emotional-journal.manus.space/invite?role=${inviteRole}`);
      toast.success("Invite link created! Share it with your therapist.");
    },
  });

  const handleCopyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Settings</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <Button
            variant={activeTab === "notifications" ? "default" : "ghost"}
            onClick={() => setActiveTab("notifications")}
            className="rounded-none border-b-2"
          >
            Notifications
          </Button>
          <Button
            variant={activeTab === "invites" ? "default" : "ghost"}
            onClick={() => setActiveTab("invites")}
            className="rounded-none border-b-2"
          >
            Invites
          </Button>
        </div>

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            {settings && (
              <>
                {/* Enable/Disable */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="notifications-enabled">
                    Enable Notifications
                  </Label>
                  <Switch
                    id="notifications-enabled"
                    checked={settings.isEnabled ?? true}
                    onCheckedChange={(checked) => {
                      updateSettings.mutate({
                        isEnabled: checked,
                      });
                    }}
                  />
                </div>

                {settings.isEnabled && (
                  <>
                    {/* Reminder Time */}
                    <div>
                      <Label htmlFor="reminder-time">
                        Daily reminder time
                      </Label>
                      <Input
                        id="reminder-time"
                        type="time"
                        value={settings.reminderTime || "09:00"}
                        onChange={(e) => {
                          updateSettings.mutate({
                            reminderTime: e.target.value,
                          });
                        }}
                        className="mt-1"
                      />
                    </div>

                    {/* Notify if no entries */}
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notify-no-entries">
                        Remind if no entries today
                      </Label>
                      <Switch
                        id="notify-no-entries"
                        checked={settings.notifyIfNoEntries ?? false}
                        onCheckedChange={(checked) => {
                          updateSettings.mutate({
                            notifyIfNoEntries: checked,
                          });
                        }}
                      />
                    </div>

                    {/* Notify if few entries */}
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notify-few-entries">
                        Remind if fewer than 3 entries
                      </Label>
                      <Switch
                        id="notify-few-entries"
                        checked={settings.notifyIfFewEntries ?? false}
                        onCheckedChange={(checked) => {
                          updateSettings.mutate({
                            notifyIfFewEntries: checked,
                          });
                        }}
                      />
                    </div>

                    {/* Therapist notification mode */}
                    <div>
                      <Label htmlFor="therapist-mode">
                        Therapist notification mode
                      </Label>
                      <Select
                        value={settings.therapistNotificationMode || "per_client"}
                        onValueChange={(value) => {
                          updateSettings.mutate({
                            therapistNotificationMode: value as any,
                          });
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="per_client">
                            Per client (instant)
                          </SelectItem>
                          <SelectItem value="batch_digest">
                            Batch digest
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {settings.therapistNotificationMode === "batch_digest" && (
                      <div>
                        <Label htmlFor="batch-time">
                          Batch digest time
                        </Label>
                        <Input
                          id="batch-time"
                          type="time"
                          value={settings.batchDigestTime || "18:00"}
                          onChange={(e) => {
                            updateSettings.mutate({
                              batchDigestTime: e.target.value,
                            });
                          }}
                          className="mt-1"
                        />
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Invites Tab */}
        {activeTab === "invites" && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="invite-role">Invite as</Label>
              <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as any)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="therapist">
                    Invite my therapist
                  </SelectItem>
                  <SelectItem value="client">
                    Invite my client
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => createInvite.mutate({ role: inviteRole })}
              disabled={createInvite.isPending}
              className="w-full"
            >
              {createInvite.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Invite Link"
              )}
            </Button>

            {inviteLink && (
              <Card className="p-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Share this link with your {inviteRole}:
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      value={inviteLink}
                      readOnly
                      className="text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyLink}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
