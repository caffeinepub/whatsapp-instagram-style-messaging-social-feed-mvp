import { useState } from "react";

export interface ImageUploadResult {
  url: string;
  error?: string;
}

export function useImageUpload() {
  const [_uploadProgress, _setUploadProgress] = useState<number>(0);

  const processImageFile = async (file: File): Promise<ImageUploadResult> => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      return { url: "", error: "File must be an image" };
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      return { url: "", error: "Image files must be under 100MB" };
    }

    try {
      // Convert to data URL for immediate display
      const dataUrl = await fileToDataUrl(file);
      return { url: dataUrl };
    } catch (_error) {
      return { url: "", error: "Failed to process image" };
    }
  };

  const processImageFiles = async (
    files: FileList | File[],
  ): Promise<ImageUploadResult[]> => {
    const fileArray = Array.from(files);
    const results: ImageUploadResult[] = [];

    for (const file of fileArray) {
      const result = await processImageFile(file);
      results.push(result);
    }

    return results;
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processClipboardItems = async (
    items: DataTransferItemList,
  ): Promise<ImageUploadResult[]> => {
    const results: ImageUploadResult[] = [];

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
    processImageFile,
    processImageFiles,
    processClipboardItems,
    uploadProgress: _uploadProgress,
  };
}
