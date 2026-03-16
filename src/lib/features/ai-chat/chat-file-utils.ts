import type { FileUIPart } from 'ai';
import { toast } from 'svelte-sonner';
import { generateId } from '$lib/utils/uuid';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
export const ACCEPTED_INPUT = 'image/jpeg,image/png,image/gif,image/webp,application/pdf';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_FILES = 5;

export interface ChatAttachment {
  id: string;
  file: File;
  previewUrl: string;
  uiPart: FileUIPart;
}

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Unsupported file type. Use JPEG, PNG, GIF, WebP, or PDF.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'File must be 5 MB or smaller.';
  }
  return null;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export async function createAttachment(file: File): Promise<ChatAttachment | null> {
  const error = validateFile(file);
  if (error) {
    toast.error(error);
    return null;
  }

  const dataUrl = await readFileAsDataUrl(file);
  const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : '';

  return {
    id: generateId(),
    file,
    previewUrl,
    uiPart: {
      type: 'file',
      mediaType: file.type,
      filename: file.name,
      url: dataUrl
    }
  };
}

export function revokeAttachment(attachment: ChatAttachment) {
  if (attachment.previewUrl) {
    URL.revokeObjectURL(attachment.previewUrl);
  }
}
