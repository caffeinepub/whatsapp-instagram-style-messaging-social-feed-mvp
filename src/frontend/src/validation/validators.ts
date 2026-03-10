export function validateUsername(username: string): string | undefined {
  if (!username || username.trim().length === 0) {
    return "Username is required";
  }
  if (username.length < 3) {
    return "Username must be at least 3 characters";
  }
  if (username.length > 20) {
    return "Username must be less than 20 characters";
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    return "Username can only contain lowercase letters, numbers, and underscores";
  }
  return undefined;
}

export function validateDisplayName(displayName: string): string | undefined {
  if (!displayName || displayName.trim().length === 0) {
    return "Display name is required";
  }
  if (displayName.length < 2) {
    return "Display name must be at least 2 characters";
  }
  if (displayName.length > 50) {
    return "Display name must be less than 50 characters";
  }
  return undefined;
}

export function validateCaption(caption: string): string | undefined {
  if (!caption || caption.trim().length === 0) {
    return "Caption is required";
  }
  if (caption.length > 2000) {
    return "Caption must be less than 2000 characters";
  }
  return undefined;
}

export function validateImageUrls(urls: string[]): string | undefined {
  if (urls.length > 10) {
    return "Maximum 10 images allowed per post";
  }
  return undefined;
}

export function validateVideoUrl(url: string): string | undefined {
  if (!url || url.trim().length === 0) {
    return "Video URL is required for reels";
  }

  const videoExtensions = /\.(mp4|webm|ogg)$/i;
  const videoUrls = /(youtube\.com|youtu\.be|vimeo\.com)/i;

  if (!videoExtensions.test(url) && !videoUrls.test(url)) {
    return "Please provide a valid video URL (mp4, webm, ogg, YouTube, or Vimeo)";
  }

  return undefined;
}

export function validateMessageContent(content: string): string | undefined {
  if (!content || content.trim().length === 0) {
    return "Message cannot be empty";
  }
  if (content.length > 1000) {
    return "Message must be less than 1000 characters";
  }
  return undefined;
}

export function validateSearchTerm(term: string): string | undefined {
  if (term.length > 50) {
    return "Search term must be less than 50 characters";
  }
  return undefined;
}

export function validateCommentText(text: string): string | undefined {
  if (!text || text.trim().length === 0) {
    return "Comment cannot be empty";
  }
  if (text.length > 500) {
    return "Comment must be less than 500 characters";
  }
  return undefined;
}

export function validateMovieTitle(title: string): string | undefined {
  if (!title || title.trim().length === 0) {
    return "Movie title is required";
  }
  if (title.length > 100) {
    return "Movie title must be less than 100 characters";
  }
  return undefined;
}

export function validateMovieDescription(
  description: string,
): string | undefined {
  if (!description || description.trim().length === 0) {
    return "Movie description is required";
  }
  if (description.length > 500) {
    return "Movie description must be less than 500 characters";
  }
  return undefined;
}

export function validateVideoFile(file: File): string | undefined {
  const maxSize = 500 * 1024 * 1024; // 500MB
  const acceptedFormats = ["video/mp4", "video/webm", "video/quicktime"];

  if (file.size > maxSize) {
    return "Video file must be less than 500MB";
  }
  if (!acceptedFormats.includes(file.type)) {
    return "Accepted video formats: MP4, WebM, MOV";
  }
  return undefined;
}

export function validateLiveStreamTitle(title: string): string | undefined {
  if (!title || title.trim().length === 0) {
    return "Stream title is required";
  }
  if (title.length > 100) {
    return "Stream title must be less than 100 characters";
  }
  return undefined;
}

export function validateLiveStreamDescription(
  description: string,
): string | undefined {
  if (description.length > 500) {
    return "Stream description must be less than 500 characters";
  }
  return undefined;
}
