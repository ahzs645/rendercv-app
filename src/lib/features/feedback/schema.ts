import * as v from 'valibot';

export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'] as const;

export const feedbackSchema = v.object({
  message: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, 'Message is required'),
    v.maxLength(5000, 'Message must be 5000 characters or fewer')
  ),
  email: v.pipe(
    v.string(),
    v.trim(),
    v.maxLength(320, 'Email must be 320 characters or fewer'),
    v.check(
      (value) => !value || v.is(v.pipe(v.string(), v.email()), value),
      'Please enter a valid email'
    )
  ),
  userId: v.pipe(v.string(), v.maxLength(256)),
  images: v.optional(
    v.array(
      v.pipe(
        v.file(),
        v.mimeType([...ACCEPTED_IMAGE_TYPES], 'Unsupported image type'),
        v.maxSize(5 * 1024 * 1024, 'Image must be 5 MB or smaller')
      )
    ),
    []
  )
});
