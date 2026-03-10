import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  FolderOpen,
  Image as ImageIcon,
  Loader2,
  Plus,
  Upload,
  Video,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ContentType } from "../backend";
import type { MediaAsset } from "../backend";
import { useMediaUpload } from "../hooks/useMediaUpload";
import { useCreatePost } from "../hooks/useQueries";
import {
  validateCaption,
  validateImageUrls,
  validateVideoUrl,
} from "../validation/validators";

interface MediaEntry {
  url: string;
  isDataUrl: boolean;
  previewType?: "image" | "video";
}

export default function CreatePostPage() {
  const [caption, setCaption] = useState("");
  const [contentType, setContentType] = useState<"post" | "reel">("post");
  const [mediaEntries, setMediaEntries] = useState<MediaEntry[]>([
    { url: "", isDataUrl: false },
  ]);
  const [errors, setErrors] = useState<{ caption?: string; images?: string }>(
    {},
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createPostMutation = useCreatePost();
  const navigate = useNavigate();
  const { processMediaFiles, processClipboardItems, uploadProgress } =
    useMediaUpload();

  // Handle paste events
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;
      try {
        const results = await processClipboardItems(items);
        if (results.length > 0) {
          const successfulUrls = results
            .filter((r) => !r.error)
            .map((r) => r.url);
          if (successfulUrls.length > 0) {
            setMediaEntries((prev) => {
              const filtered = prev.filter((e) => e.url.trim() !== "");
              const newEntries: MediaEntry[] = successfulUrls.map((url) => ({
                url,
                isDataUrl: true,
                previewType: "image" as const,
              }));
              return [...filtered, ...newEntries].slice(0, 10);
            });
            toast.success(
              `${successfulUrls.length} image(s) pasted successfully`,
            );
          }
          const errs = results.filter((r) => r.error);
          if (errs.length > 0) {
            toast.error(errs[0].error || "Failed to paste image");
          }
        }
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to paste media",
        );
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [processClipboardItems]);

  // Handle drag and drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const results = await processMediaFiles(files);

      const successful = results.filter((r) => !r.error);
      if (successful.length > 0) {
        setMediaEntries((prev) => {
          const filtered = prev.filter((e) => e.url.trim() !== "");
          const newEntries: MediaEntry[] = successful.map((r) => ({
            url: r.url,
            isDataUrl: r.isDataUrl,
            previewType: r.fileType,
          }));
          return [...filtered, ...newEntries].slice(0, 10);
        });
        toast.success(`${successful.length} file(s) uploaded successfully`);
      }

      const errs = results.filter((r) => r.error);
      if (errs.length > 0) {
        toast.error(errs[0].error || "Failed to upload file");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to process dropped files",
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file picker selection
  const handleFilePickerChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const results = await processMediaFiles(files);

      // Reset file input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";

      const successful = results.filter((r) => !r.error);
      if (successful.length > 0) {
        setMediaEntries((prev) => {
          const filtered = prev.filter((e) => e.url.trim() !== "");
          const newEntries: MediaEntry[] = successful.map((r) => ({
            url: r.url,
            isDataUrl: r.isDataUrl,
            previewType: r.fileType,
          }));
          return [...filtered, ...newEntries].slice(0, 10);
        });
        toast.success(`${successful.length} file(s) added successfully`);
      }

      const errs = results.filter((r) => r.error);
      if (errs.length > 0) {
        toast.error(errs[0].error || "Failed to process file");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to process selected files",
      );
      // Reset file input on error too
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddMediaUrl = () => {
    if (mediaEntries.length < 10) {
      setMediaEntries([...mediaEntries, { url: "", isDataUrl: false }]);
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMediaEntries(mediaEntries.filter((_, i) => i !== index));
  };

  const handleMediaUrlChange = (index: number, value: string) => {
    const updated = [...mediaEntries];
    updated[index] = { url: value, isDataUrl: false };
    setMediaEntries(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const captionError = validateCaption(caption);
    const filteredEntries = mediaEntries.filter((e) => e.url.trim() !== "");
    const filteredUrls = filteredEntries.map((e) => e.url);

    let imagesError: string | undefined;
    if (contentType === "reel") {
      if (filteredUrls.length === 0) {
        imagesError = "At least one video URL is required for reels";
      } else {
        // Only validate non-data URLs as video URLs
        const firstEntry = filteredEntries[0];
        if (!firstEntry.isDataUrl) {
          imagesError = validateVideoUrl(filteredUrls[0]);
        }
      }
    } else {
      // For posts, only validate non-data URLs
      const urlOnlyEntries = filteredEntries
        .filter((e) => !e.isDataUrl)
        .map((e) => e.url);
      if (urlOnlyEntries.length > 0) {
        imagesError = validateImageUrls(urlOnlyEntries);
      }
    }

    if (captionError || imagesError) {
      setErrors({ caption: captionError, images: imagesError });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const backendContentType =
        contentType === "reel" ? ContentType.reel : ContentType.post;
      const media: MediaAsset[] = filteredEntries.map((entry) => ({
        url: entry.url,
        isDataUrl: entry.isDataUrl,
      }));

      await createPostMutation.mutateAsync({
        caption,
        media,
        contentType: backendContentType,
      });

      toast.success("Post created successfully!");
      navigate({ to: "/" });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to create post. Please try again.";
      toast.error(message);
      setErrors({ caption: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const acceptTypes = contentType === "reel" ? "video/*" : "image/*,video/*";
  const isBusy = isSubmitting || createPostMutation.isPending || isUploading;

  return (
    <div className="space-y-6 p-4 pb-24 md:p-6 md:pb-6">
      <h1 className="text-2xl font-bold">
        Create {contentType === "reel" ? "Reel" : "Post"}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>New {contentType === "reel" ? "Reel" : "Post"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Content Type Selector */}
            <div className="space-y-3">
              <Label>Content Type</Label>
              <RadioGroup
                value={contentType}
                onValueChange={(value) =>
                  setContentType(value as "post" | "reel")
                }
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="post" id="post" />
                  <Label
                    htmlFor="post"
                    className="flex items-center gap-2 cursor-pointer font-normal"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Post
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="reel" id="reel" />
                  <Label
                    htmlFor="reel"
                    className="flex items-center gap-2 cursor-pointer font-normal"
                  >
                    <Video className="h-4 w-4" />
                    Reel
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Caption */}
            <div className="space-y-2">
              <Label htmlFor="caption">Caption</Label>
              <Textarea
                id="caption"
                placeholder="What's on your mind?"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
                className={errors.caption ? "border-destructive" : ""}
              />
              {errors.caption && (
                <p className="text-sm text-destructive">{errors.caption}</p>
              )}
            </div>

            {/* Media Upload Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Label>
                  {contentType === "reel" ? "Video" : "Images / Videos"}
                  {contentType === "post" && " (optional, up to 10)"}
                </Label>
                <div className="flex gap-2">
                  {/* Upload from device button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={mediaEntries.length >= 10 || isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FolderOpen className="mr-2 h-4 w-4" />
                    )}
                    Upload from device
                  </Button>
                  {/* Add URL button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddMediaUrl}
                    disabled={mediaEntries.length >= 10}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add URL
                  </Button>
                </div>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptTypes}
                multiple={contentType === "post"}
                className="hidden"
                onChange={handleFilePickerChange}
              />

              {/* Upload progress */}
              {isUploading && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Processing file...
                  </p>
                  <Progress value={uploadProgress} className="h-1.5" />
                </div>
              )}

              {/* Drag and Drop Zone */}
              <div
                ref={dropZoneRef}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50"
                }`}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    fileInputRef.current?.click();
                }}
              >
                <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-1">
                  Drag & drop files here, click to browse, or paste from
                  clipboard
                </p>
                <p className="text-xs text-muted-foreground">
                  {contentType === "reel"
                    ? "Videos up to 2500MB (2.5GB)"
                    : "Images (JPG, PNG, GIF) up to 100MB · Videos up to 2500MB (2.5GB)"}
                </p>
              </div>

              {/* Media previews for uploaded files */}
              {mediaEntries.some(
                (e) => e.isDataUrl || e.previewType === "video",
              ) && (
                <div className="grid grid-cols-3 gap-2">
                  {mediaEntries.map((entry, index) =>
                    (entry.isDataUrl || entry.previewType === "video") &&
                    entry.url ? (
                      <div
                        key={entry.url || index}
                        className="relative group rounded-md overflow-hidden bg-muted aspect-square"
                      >
                        {entry.previewType === "video" ? (
                          <video
                            src={entry.url}
                            className="w-full h-full object-cover"
                            muted
                            preload="metadata"
                          />
                        ) : (
                          <img
                            src={entry.url}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleRemoveMedia(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        {entry.previewType === "video" && (
                          <div className="absolute bottom-1 left-1 bg-black/60 rounded px-1 py-0.5">
                            <Video className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                    ) : null,
                  )}
                </div>
              )}

              {/* URL Inputs for non-uploaded entries */}
              {mediaEntries.map((entry, index) =>
                !entry.isDataUrl && entry.previewType !== "video" ? (
                  <div
                    key={`url-entry-${String(index)}`}
                    className="flex gap-2"
                  >
                    <Input
                      type="text"
                      placeholder={
                        contentType === "reel"
                          ? "https://example.com/video.mp4 or YouTube/Vimeo URL"
                          : "https://example.com/image.jpg or data:image/..."
                      }
                      value={entry.url}
                      onChange={(e) =>
                        handleMediaUrlChange(index, e.target.value)
                      }
                    />
                    {mediaEntries.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMedia(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ) : null,
              )}

              {errors.images && (
                <p className="text-sm text-destructive">{errors.images}</p>
              )}
            </div>

            {createPostMutation.isError && !isSubmitting && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {createPostMutation.error instanceof Error
                    ? createPostMutation.error.message
                    : "Failed to create post. Please try again."}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: "/" })}
                className="flex-1"
                disabled={isBusy}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isBusy}>
                {isSubmitting || createPostMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Post ${contentType === "reel" ? "Reel" : ""}`
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
