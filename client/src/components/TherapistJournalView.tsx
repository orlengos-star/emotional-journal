import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function TherapistJournalView() {
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: clients, isLoading: clientsLoading } =
    trpc.relationship.getMyClients.useQuery();

  const selectedClient = clients?.find((c) => c.clientId === selectedClientId);

  const { data: entries, isLoading: entriesLoading } =
    trpc.journal.getByDateRange.useQuery(
      {
        startDate: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
        endDate: new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0),
      },
      {
        enabled: !!selectedClientId,
      }
    );

  const { data: selectedEntry } = trpc.journal.getById.useQuery(
    { id: selectedEntryId || 0 },
    {
      enabled: !!selectedEntryId,
    }
  );

  const updateEntry = trpc.journal.update.useMutation({
    onSuccess: () => {
      setShowNotes(false);
      setNotes("");
    },
  });

  const handleSaveNotes = async () => {
    if (selectedEntryId) {
      await updateEntry.mutateAsync({
        id: selectedEntryId,
        therapistComments: notes,
      });
    }
  };

  if (clientsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin w-6 h-6 text-muted-foreground" />
      </div>
    );
  }

  if (!clients || clients.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          No clients connected yet. Ask your clients to invite you through the app.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Clients List */}
      <div className="md:col-span-1">
        <h3 className="font-semibold text-foreground mb-4">My Clients</h3>
        <div className="space-y-2">
          {clients.map((relationship) => (
            <Button
              key={relationship.id}
              variant={
                selectedClientId === relationship.clientId
                  ? "default"
                  : "outline"
              }
              className="w-full justify-start"
              onClick={() => setSelectedClientId(relationship.clientId)}
            >
              Client #{relationship.clientId}
            </Button>
          ))}
        </div>
      </div>

      {/* Entries View */}
      <div className="md:col-span-2">
        {selectedClientId ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Entries</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setMonth(newDate.getMonth() - 1);
                    setSelectedDate(newDate);
                  }}
                >
                  ← Prev
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setMonth(newDate.getMonth() + 1);
                    setSelectedDate(newDate);
                  }}
                >
                  Next →
                </Button>
              </div>
            </div>

            {entriesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin w-6 h-6 text-muted-foreground" />
              </div>
            ) : entries && entries.length > 0 ? (
              <div className="space-y-3">
                {entries.map((entry) => (
                  <Card
                    key={entry.id}
                    className={`p-4 cursor-pointer hover:bg-accent transition-colors ${
                      entry.isHighlighted ? "border-2 border-blue-500" : ""
                    }`}
                    onClick={() => {
                      setSelectedEntryId(entry.id);
                      setNotes(entry.therapistComments || "");
                      setShowNotes(true);
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground">
                          {new Date(entry.entryDate).toLocaleDateString()}
                        </p>
                        <p className="text-foreground line-clamp-2 mt-1">
                          {entry.text}
                        </p>
                        {entry.therapistComments && (
                          <div className="mt-2 p-2 bg-muted rounded text-sm text-muted-foreground">
                            <MessageSquare className="w-3 h-3 inline mr-1" />
                            {entry.therapistComments}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  No entries this month
                </p>
              </Card>
            )}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              Select a client to view their entries
            </p>
          </Card>
        )}
      </div>

      {/* Notes Dialog */}
      {showNotes && (
        <Dialog open={showNotes} onOpenChange={setShowNotes}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Therapist Notes (Private)</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Entry:</p>
                <p className="line-clamp-3">{selectedEntry?.text}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Your private notes
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add private notes about this entry..."
                  className="mt-1 min-h-24"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowNotes(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveNotes}
                  disabled={updateEntry.isPending}
                  className="flex-1"
                >
                  {updateEntry.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Notes"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
