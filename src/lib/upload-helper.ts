import { BadRequestError } from './errors';
import { UploadService, isUploadEnabled, type UploadFileOptions } from '../services/upload-service';

/**
 * Validates a file for upload
 * @param file File to validate
 * @param allowedTypes Allowed MIME types
 * @param maxSize Maximum file size in bytes
 */
export function validateFile(
    file: File,
    allowedTypes: string[] = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: number = 5 * 1024 * 1024 // 5MB default
): void {
    const fileType = file.type || 'application/octet-stream';

    if (!allowedTypes.includes(fileType)) {
        throw new BadRequestError(
            `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
        );
    }

    if (file.size > maxSize) {
        throw new BadRequestError(
            `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`
        );
    }
}

/**
 * Handles logo file upload - decoupled helper that can be used anywhere
 * @param logoFile File to upload (optional)
 * @param logoUrl Existing URL (optional)
 * @param context Request context for service initialization
 * @returns Final logo URL (either from upload or provided URL)
 */
export async function handleLogoUpload(
    logoFile: File | null | undefined,
    logoUrl: string | null | undefined,
    context?: any
): Promise<string | null> {
    // If both are provided, prefer file upload
    if (logoFile && logoFile.size > 0) {
        // Validate file
        validateFile(logoFile);

        // Check if upload is enabled
        if (!isUploadEnabled()) {
            throw new BadRequestError(
                'File upload is not configured. Please provide logoUrl instead or configure S3 storage.'
            );
        }

        // Upload file
        const uploadService = new UploadService({ context });
        const uploadResult = await uploadService.uploadFile({
            file: logoFile,
            filename: logoFile.name || 'logo',
            contentType: logoFile.type || 'image/png',
            folder: 'logos',
        });

        return uploadResult.url;
    }

    // Otherwise, use provided URL
    return logoUrl || null;
}

