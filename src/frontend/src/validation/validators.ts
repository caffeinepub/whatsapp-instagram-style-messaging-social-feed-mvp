export function validateUsername(username: string): string | undefined {
  if (!username || username.trim().length === 0) {
    return 'Username is required';
  }
  if (username.length < 3) {
    return 'Username must be at least 3 characters';
  }
  if (username.length > 20) {
    return 'Username must be less than 20 characters';
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    return 'Username can only contain lowercase letters, numbers, and underscores';
  }
  return undefined;
}

export function validateDisplayName(displayName: string): string | undefined {
  if (!displayName || displayName.trim().length === 0) {
    return 'Display name is required';
  }
  if (displayName.length < 2) {
    return 'Display name must be at least 2 characters';
  }
  if (displayName.length > 50) {
    return 'Display name must be less than 50 characters';
  }
  return undefined;
}

export function validateCaption(caption: string): string | undefined {
  if (!caption || caption.trim().length === 0) {
    return 'Caption is required';
  }
  if (caption.length > 2000) {
    return 'Caption must be less than 2000 characters';
  }
  return undefined;
}

export function validateImageUrls(urls: string[]): string | undefined {
  if (urls.length > 10) {
    return 'Maximum 10 images allowed per post';
  }
  return undefined;
}

export function validateMessageContent(content: string): string | undefined {
  if (!content || content.trim().length === 0) {
    return 'Message cannot be empty';
  }
  if (content.length > 1000) {
    return 'Message must be less than 1000 characters';
  }
  return undefined;
}

export function validateSearchTerm(term: string): string | undefined {
  if (term.length > 50) {
    return 'Search term must be less than 50 characters';
  }
  return undefined;
}
