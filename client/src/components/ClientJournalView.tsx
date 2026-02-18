import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar, Plus, Loader2 } from "lucide-react";
import EntryCard from "./EntryCard";
import DayRatingPopup from "./DayRatingPopup";
import { formatDate } from "@/lib/utils";

export default function ClientJournalView() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newEntryText, setNewEntryText] = useState("");
  const [newEntryDate, setNewEntryDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedEntry, setSelectedEntry] = useState<number | null>(null);
  const [showRating, setShowRating] = useState(false);

  // Get entries for the current month
  const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

  const { data: entries, isLoading, refetch } =
    trpc.journal.getByDateRange.useQuery({
      startDate: startOfMonth,
      endDate: endOfMonth,
    });

  const { data: dayRating } = trpc.rating.getByDate.useQuery({
    date: selectedDate,
  });

  const createEntry = trpc.journal.create.useMutation({
    onSuccess: () => {
      setNewEntryText("");
      setNewEntryDate(new Date().toISOString().split("T")[0]);
      setShowNewEntry(false);
      refetch();
    },
  });

  const handleCreateEntry = async () => {
    if (!newEntryText.trim()) return;

    await createEntry.mutateAsync({
      text: newEntryText,
      entryDate: new Date(newEntryDate),
    });
  };

  // Group entries by date
  const entriesByDate = useMemo(() => {
    const grouped: Record<string, typeof entries> = {};
    entries?.forEach((entry) => {
      const dateKey = formatDate(entry.entryDate);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(entry);
    });
    return grouped;
  }, [entries]);

  // Get dates with entries
  const datesWithEntries = Object.keys(entriesByDate).sort().reverse();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin w-6 h-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with new entry button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            {selectedDate.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <p className="text-sm text-muted-foreground">
            {datesWithEntries.length} days with entries
          </p>
        </div>

        <Dialog open={showNewEntry} onOpenChange={setShowNewEntry}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Date
                </label>
                <Input
                  type="date"
                  value={newEntryDate}
                  onChange={(e) => setNewEntryDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Your thoughts
                </label>
                <Textarea
                  placeholder="Write your thoughts, feelings, or reflections..."
                  value={newEntryText}
                  onChange={(e) => setNewEntryText(e.target.value)}
                  className="mt-1 min-h-32"
                />
              </div>
              <Button
                onClick={handleCreateEntry}
                disabled={createEntry.isPending || !newEntryText.trim()}
                className="w-full"
              >
                {createEntry.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Entry"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => {
            const newDate = new Date(selectedDate);
            newDate.setMonth(newDate.getMonth() - 1);
            setSelectedDate(newDate);
          }}
        >
          ← Previous
        </Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          {selectedDate.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })}
        </div>
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

      {/* Entries List */}
      <div className="space-y-4">
        {datesWithEntries.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              No entries this month. Start journaling to see them here.
            </p>
          </Card>
        ) : (
          datesWithEntries.map((dateKey) => {
            const dateEntries = entriesByDate[dateKey] || [];
            const entryDate = new Date(dateKey);
            const hasRating = dayRating?.ratingDate === entryDate;

            return (
              <div key={dateKey} className="space-y-2">
                <div className="flex items-center justify-between px-2">
                  <h3 className="font-semibold text-foreground">{dateKey}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedDate(entryDate);
                      setShowRating(true);
                    }}
                  >
                    {dayRating?.clientRating ? "✓ Rated" : "Rate day"}
                  </Button>
                </div>
                {dateEntries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    onClick={() => setSelectedEntry(entry.id)}
                  />
                ))}
              </div>
            );
          })
        )}
      </div>

      {/* Rating Popup */}
      {showRating && (
        <DayRatingPopup
          date={selectedDate}
          onClose={() => setShowRating(false)}
          onRated={() => refetch()}
        />
      )}
    </div>
  );
}
