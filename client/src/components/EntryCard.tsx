import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";
import { JournalEntry } from "@/types";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

interface EntryCardProps {
  entry: JournalEntry;
  onClick?: () => void;
}

export default function EntryCard({ entry, onClick }: EntryCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(entry.text);

  const updateEntry = trpc.journal.update.useMutation({
    onSuccess: () => {
      setIsEditing(false);
    },
  });

  const deleteEntry = trpc.journal.delete.useMutation({
    onSuccess: () => {
      // Refetch will be handled by parent
    },
  });

  const handleSave = async () => {
    if (editText.trim()) {
      await updateEntry.mutateAsync({
        id: entry.id,
        text: editText,
      });
    }
  };

  return (
    <>
      <Card
        className="p-4 cursor-pointer hover:bg-accent transition-colors"
        onClick={onClick}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">
              {new Date(entry.createdAt).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
            <p className="text-foreground line-clamp-3 mt-1">{entry.text}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                deleteEntry.mutate({ id: entry.id });
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="min-h-32"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateEntry.isPending || !editText.trim()}
                className="flex-1"
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
