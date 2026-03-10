import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Camera, Loader2, Radio } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useStartLiveStream } from "../hooks/useQueries";
import {
  validateLiveStreamDescription,
  validateLiveStreamTitle,
} from "../validation/validators";

export default function StartLivePage() {
  const navigate = useNavigate();
  const startLiveStreamMutation = useStartLiveStream();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const titleError = validateLiveStreamTitle(title);
    if (titleError) newErrors.title = titleError;
    const descError = validateLiveStreamDescription(description);
    if (descError) newErrors.description = descError;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const streamId = await startLiveStreamMutation.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        streamUrl: `simulated-stream-${Date.now()}`,
      });
      toast.success("You are now live!");
      navigate({
        to: "/live/$streamId",
        params: { streamId: streamId.toString() },
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to start live stream",
      );
    }
  };

  return (
    <div className="space-y-6 p-4 pb-24 md:p-6 md:pb-6">
      <Button
        variant="ghost"
        onClick={() => navigate({ to: "/live" })}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Live
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-red-500" />
            Start Live Stream
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Camera Preview Placeholder */}
          <div className="flex aspect-video items-center justify-center rounded-xl bg-muted">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Camera className="h-12 w-12" />
              <p className="text-sm">Camera preview will appear here</p>
              <p className="text-xs">This is a simulated live stream</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Stream Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What are you streaming about?"
                maxLength={100}
                disabled={startLiveStreamMutation.isPending}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell viewers what to expect..."
                rows={3}
                maxLength={500}
                disabled={startLiveStreamMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/500
              </p>
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={startLiveStreamMutation.isPending}
              className="w-full gap-2 bg-red-500 hover:bg-red-600"
            >
              {startLiveStreamMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Radio className="h-4 w-4" />
                  Go Live Now
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
