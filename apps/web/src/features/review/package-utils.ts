import createWebShareEngine from '@firstform/json-url/web-share';
import type { CvFileSections, ReviewProposalPackage } from '@rendercv/contracts';
import { downloadBlob } from '../viewer/download';

const REVIEW_PACKAGE_EXTENSION = '.rendercv.review.json';
const REVIEW_HISTORY_EXTENSION = '.rendercv.review-history.json';
const MAX_IMPORT_SIZE = 4 * 1024 * 1024;
const MAX_REVIEW_URL_LENGTH = 24000;

const shareEngine = createWebShareEngine<ReviewProposalPackage>({
  maxLength: MAX_REVIEW_URL_LENGTH
});

export class ReviewProposalTooLargeError extends Error {
  constructor() {
    super('Review proposal is too large to fit in a share link.');
  }
}

function isProposalLengthError(error: unknown) {
  return error instanceof Error && /maxLength/i.test(error.message);
}

export async function encodeReviewProposalPackage(payload: ReviewProposalPackage) {
  return await shareEngine.compress(payload);
}

export async function decodeReviewProposalPackage(token: string) {
  return validateReviewProposalPackage(await shareEngine.decompress(token, { deURI: true }));
}

export async function buildReviewProposalUrl(payload: ReviewProposalPackage) {
  let token: string;

  try {
    token = await encodeReviewProposalPackage(payload);
  } catch (error) {
    if (isProposalLengthError(error)) {
      throw new ReviewProposalTooLargeError();
    }
    throw error;
  }

  const url = new URL(`${import.meta.env.BASE_URL}review-import`, window.location.origin);
  url.hash = token;

  if (url.toString().length > MAX_REVIEW_URL_LENGTH) {
    throw new ReviewProposalTooLargeError();
  }

  return url.toString();
}

export async function exportReviewProposalPackage(payload: ReviewProposalPackage) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  await downloadBlob(blob, `${payload.fileName}${REVIEW_PACKAGE_EXTENSION}`);
}

export async function exportReviewHistoryFile(payload: object, fileName: string) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  await downloadBlob(blob, `${fileName}${REVIEW_HISTORY_EXTENSION}`);
}

export function importReviewProposalPackage(): Promise<ReviewProposalPackage | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.rendercv.review.json,.json';

    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      if (file.size > MAX_IMPORT_SIZE) {
        reject(new Error(`File too large (max ${MAX_IMPORT_SIZE / 1024 / 1024} MB).`));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        try {
          resolve(validateReviewProposalPackage(JSON.parse(reader.result as string)));
        } catch (error) {
          reject(error instanceof Error ? error : new Error('Failed to parse review proposal file.'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsText(file);
    });

    input.click();
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSections(value: unknown): value is CvFileSections {
  return (
    isRecord(value) &&
    typeof value.cv === 'string' &&
    typeof value.design === 'string' &&
    typeof value.locale === 'string' &&
    typeof value.settings === 'string'
  );
}

export function validateReviewProposalPackage(value: unknown): ReviewProposalPackage {
  if (!isRecord(value)) {
    throw new Error('Invalid review proposal payload.');
  }

  if (
    value.version !== 1 ||
    typeof value.proposalId !== 'string' ||
    (value.parentProposalId !== undefined && typeof value.parentProposalId !== 'string') ||
    typeof value.threadId !== 'string' ||
    typeof value.rootFingerprint !== 'string' ||
    typeof value.fileName !== 'string' ||
    !isSections(value.rootBaselineSections) ||
    !isSections(value.proposedSections) ||
    typeof value.reviewerName !== 'string' ||
    typeof value.createdAt !== 'number'
  ) {
    throw new Error('Invalid review proposal payload.');
  }

  return {
    version: 1,
    proposalId: value.proposalId,
    ...(value.parentProposalId ? { parentProposalId: value.parentProposalId } : {}),
    threadId: value.threadId,
    rootFingerprint: value.rootFingerprint,
    fileName: value.fileName,
    rootBaselineSections: value.rootBaselineSections,
    proposedSections: value.proposedSections,
    reviewerName: value.reviewerName,
    createdAt: value.createdAt
  };
}
