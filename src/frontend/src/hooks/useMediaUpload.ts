import { useState } from "react";

export interface MediaUploadResult {
  url: string;
  isDataUrl: boolean;
  fileType: "image" | "video";
  error?: string;
}

const IMAGE_MAX_SIZE = 100 * 1024 * 1024; // 100MB
const VIDEO_MAX_SIZE = 2500 * 1024 * 1024; // 2500MB (2.5GB)

// Timeout for FileReader operations (30 seconds)
const FILE_READER_TIMEOUT_MS = 30_000;

export function useMediaUpload() {
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const fileToDataUrl = (
    file: File,
    onProgress?: (pct: number) => void,
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      const timeout = setTimeout(() => {
        reader.abort();
        reject(
          new Error(
            "File reading timed out. The file may be too large to process.",
          ),
        );
      }, FILE_READER_TIMEOUT_MS);

      reader.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      reader.onload = () => {
        clearTimeout(timeout);
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("Failed to read file. Please try again."));
      };
      reader.onabort = () => {
        clearTimeout(timeout);
        reject(new Error("File reading was aborted."));
      };

      try {
        reader.readAsDataURL(file);
      } catch (err) {
        clearTimeout(timeout);
        reject(err);
      }
    });
  };

  const processMediaFile = async (file: File): Promise<MediaUploadResult> => {
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      return {
        url: "",
        isDataUrl: false,
        fileType: "image",
        error: "File must be an image or video",
      };
    }

    if (isImage && file.size > IMAGE_MAX_SIZE) {
      return {
        url: "",
        isDataUrl: false,
        fileType: "image",
        error: "Image files must be under 100MB",
      };
    }

    if (isVideo && file.size > VIDEO_MAX_SIZE) {
      return {
        url: "",
        isDataUrl: false,
        fileType: "video",
        error: "Video files must be under 2500MB (2.5GB)",
      };
    }

    // For video files: use object URL for preview instead of data URL.
    // Converting large videos to base64 data URLs is extremely memory-intensive
    // and will cause the browser to hang or the IC canister call to fail due to
    // payload size limits. Object URLs are instant and work perfectly for preview.
    if (isVideo) {
      try {
        setUploadProgress(0);
        const objectUrl = URL.createObjectURL(file);
        setUploadProgress(100);
        return {
          url: objectUrl,
          isDataUrl: false,
          fileType: "video",
        };
      } catch (err) {
        return {
          url: "",
          isDataUrl: false,
          fileType: "video",
          error:
            err instanceof Error ? err.message : "Failed to process video file",
        };
      }
    }

    // For images: use data URL (base64) — images are small enough
    try {
      setUploadProgress(0);
      const dataUrl = await fileToDataUrl(file, (pct) =>
        setUploadProgress(pct),
      );
      setUploadProgress(100);
      return {
        url: dataUrl,
        isDataUrl: true,
        fileType: "image",
      };
    } catch (err) {
      return {
        url: "",
        isDataUrl: false,
        fileType: "image",
        error: err instanceof Error ? err.message : "Failed to process file",
      };
    }
  };

  const processMediaFiles = async (
    files: FileList | File[],
  ): Promise<MediaUploadResult[]> => {
    const fileArray = Array.from(files);
    const results: MediaUploadResult[] = [];
    for (const file of fileArray) {
      const result = await processMediaFile(file);
      results.push(result);
    }
    return results;
  };

  // Keep image-only helpers for backward compatibility
  const processImageFile = async (
    file: File,
  ): Promise<{ url: string; error?: string }> => {
    const result = await processMediaFile(file);
    return { url: result.url, error: result.error };
  };

  const processImageFiles = async (
    files: FileList | File[],
  ): Promise<{ url: string; error?: string }[]> => {
    const fileArray = Array.from(files);
    return Promise.all(fileArray.map(processImageFile));
  };

  const processClipboardItems = async (
    items: DataTransferItemList,
  ): Promise<{ url: string; error?: string }[]> => {
    const results: { url: string; error?: string }[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          const result = await processImageFile(file);
          results.push(result);
        }
      }
    }
    return results;
  };

  return {
    processMediaFile,
    processMediaFiles,
    processImageFile,
    processImageFiles,
    processClipboardItems,
    uploadProgress,
  };
}
