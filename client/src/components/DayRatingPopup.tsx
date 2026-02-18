import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface DayRatingPopupProps {
  date: Date;
  onClose: () => void;
  onRated?: () => void;
}

const ratingOptions = [
  { value: "negative", label: "Negative", emoji: "😞" },
  { value: "mostly_negative", label: "Mostly Negative", emoji: "😕" },
  { value: "neutral", label: "Neutral", emoji: "😐" },
  { value: "mostly_positive", label: "Mostly Positive", emoji: "🙂" },
  { value: "positive", label: "Positive", emoji: "😊" },
] as const;

export default function DayRatingPopup({
  date,
  onClose,
  onRated,
}: DayRatingPopupProps) {
  const [selectedRating, setSelectedRating] = useState<string | null>(null);

  const { data: currentRating } = trpc.rating.getByDate.useQuery({
    date,
  });

  const upsertRating = trpc.rating.upsert.useMutation({
    onSuccess: () => {
      onRated?.();
      onClose();
    },
  });

  useEffect(() => {
    if (currentRating?.clientRating) {
      setSelectedRating(currentRating.clientRating);
    }
  }, [currentRating]);

  const handleRate = async (rating: string) => {
    await upsertRating.mutateAsync({
      ratingDate: date,
      clientRating: rating as any,
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How was your day?</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-2">
            {ratingOptions.map((option) => (
              <Button
                key={option.value}
                variant={
                  selectedRating === option.value ? "default" : "outline"
                }
                className="h-auto flex flex-col items-center justify-center py-3 px-2"
                onClick={() => handleRate(option.value)}
                disabled={upsertRating.isPending}
              >
                <span className="text-2xl mb-1">{option.emoji}</span>
                <span className="text-xs text-center">{option.label}</span>
              </Button>
            ))}
          </div>
          {upsertRating.isPending && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
