import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Film, Image, Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { useUploadMovie } from "../hooks/useQueries";
import {
  validateMovieDescription,
  validateMovieTitle,
  validateVideoFile,
} from "../validation/validators";

export default function UploadMoviePage() {
  const navigate = useNavigate();
  const uploadMovieMutation = useUploadMovie();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnailProgress, setThumbnailProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setThumbnailPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setErrors((prev) => ({ ...prev, thumbnail: "" }));
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const videoError = validateVideoFile(file);
    if (videoError) {
      setErrors((prev) => ({ ...prev, video: videoError }));
      return;
    }
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, video: "" }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const titleError = validateMovieTitle(title);
    if (titleError) newErrors.title = titleError;
    const descError = validateMovieDescription(description);
    if (descError) newErrors.description = descError;
    if (!videoFile) newErrors.video = "Video file is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsUploading(true);
    try {
      // Build thumbnail blob
      let thumbnailBlob: ExternalBlob;
      if (thumbnailFile) {
        const thumbBytes = new Uint8Array(await thumbnailFile.arrayBuffer());
        thumbnailBlob = ExternalBlob.fromBytes(thumbBytes).withUploadProgress(
          (pct) => setThumbnailProgress(pct),
        );
      } else {
        thumbnailBlob = ExternalBlob.fromURL("");
      }

      // Build video blob
      const videoBytes = new Uint8Array(await videoFile!.arrayBuffer());
      const videoBlob = ExternalBlob.fromBytes(videoBytes).withUploadProgress(
        (pct) => setVideoProgress(pct),
      );

      await uploadMovieMutation.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        thumbnail: thumbnailBlob,
        videoFile: videoBlob,
      });

      toast.success("Movie uploaded successfully!");
      navigate({ to: "/movies" });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload movie",
      );
    } finally {
      setIsUploading(false);
      setThumbnailProgress(0);
      setVideoProgress(0);
    }
  };

  return (
    <div className="space-y-6 p-4 pb-24 md:p-6 md:pb-6">
      <Button
        variant="ghost"
        onClick={() => navigate({ to: "/movies" })}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Movies
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Film className="h-5 w-5" />
            Upload Movie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter movie title"
                maxLength={100}
                disabled={isUploading}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your movie..."
                rows={3}
                maxLength={500}
                disabled={isUploading}
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/500
              </p>
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
            </div>

            {/* Thumbnail */}
            <div className="space-y-2">
              <Label>Thumbnail (optional)</Label>
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleThumbnailChange}
                disabled={isUploading}
              />
              {thumbnailPreview ? (
                <div className="relative">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="h-40 w-full rounded-lg object-cover"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="absolute right-2 top-2"
                    onClick={() => thumbnailInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => thumbnailInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Image className="h-8 w-8" />
                  <span className="text-sm">Click to upload thumbnail</span>
                </button>
              )}
              {isUploading && thumbnailFile && thumbnailProgress > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Uploading thumbnail... {thumbnailProgress}%
                  </p>
                  <Progress value={thumbnailProgress} />
                </div>
              )}
            </div>

            {/* Video File */}
            <div className="space-y-2">
              <Label>Video File *</Label>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                className="hidden"
                onChange={handleVideoChange}
                disabled={isUploading}
              />
              {videoPreview ? (
                <div className="space-y-2">
                  <video
                    src={videoPreview}
                    controls
                    className="w-full rounded-lg"
                    style={{ maxHeight: "200px" }}
                  >
                    <track kind="captions" />
                  </video>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    Change Video
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Film className="h-8 w-8" />
                  <span className="text-sm">
                    Click to upload video (MP4, WebM, MOV — max 500MB)
                  </span>
                </button>
              )}
              {errors.video && (
                <p className="text-sm text-destructive">{errors.video}</p>
              )}
              {isUploading && videoProgress > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Uploading video... {videoProgress}%
                  </p>
                  <Progress value={videoProgress} />
                </div>
              )}
            </div>

            <Button type="submit" disabled={isUploading} className="w-full">
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Movie
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
