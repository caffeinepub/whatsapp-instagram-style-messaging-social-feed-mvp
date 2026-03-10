import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Image, Loader2, Upload, Video } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useUploadStory } from "../hooks/useQueries";

export default function UploadStoryPage() {
  const navigate = useNavigate();
  const uploadStoryMutation = useUploadStory();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isImage, setIsImage] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error("File must be less than 50MB");
      return;
    }

    const acceptedImageTypes = ["image/jpeg", "image/png", "image/gif"];
    const acceptedVideoTypes = ["video/mp4", "video/webm"];
    const isImageFile = acceptedImageTypes.includes(file.type);
    const isVideoFile = acceptedVideoTypes.includes(file.type);

    if (!isImageFile && !isVideoFile) {
      toast.error("Accepted formats: JPG, PNG, GIF, MP4, WebM");
      return;
    }

    setSelectedFile(file);
    setIsImage(isImageFile);

    if (isImageFile) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      await uploadStoryMutation.mutateAsync({
        url: dataUrl,
        isDataUrl: true,
      });

      toast.success("Story uploaded! Your followers can now view it.");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload story",
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 pb-24 md:p-6 md:pb-6">
      <Button
        variant="ghost"
        onClick={() => navigate({ to: "/" })}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Feed
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Upload Story
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Stories are visible only to your followers and can be viewed once
            per follower.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,video/mp4,video/webm"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />

          {preview ? (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-xl">
                {isImage ? (
                  <img
                    src={preview}
                    alt="Story preview"
                    className="max-h-96 w-full object-contain"
                  />
                ) : (
                  <video
                    src={preview}
                    controls
                    className="w-full"
                    style={{ maxHeight: "384px" }}
                  >
                    <track kind="captions" />
                  </video>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full"
              >
                Change File
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex h-48 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="flex gap-3">
                <Image className="h-8 w-8" />
                <Video className="h-8 w-8" />
              </div>
              <div className="text-center">
                <p className="font-medium">Click to select photo or video</p>
                <p className="text-xs">JPG, PNG, GIF, MP4, WebM — max 50MB</p>
              </div>
            </button>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!selectedFile || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading Story...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Share Story
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
