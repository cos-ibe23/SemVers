import { env } from '../env';
import { ApiError, ServerError, BadRequestError } from '../lib/errors';
import { Service, type ServiceOptions } from './service';

export interface UploadFileOptions {
    file: File | Buffer;
    filename: string;
    contentType: string;
    folder?: string; // e.g., 'logos', 'documents'
}

export interface UploadResult {
    url: string; // Public URL to access the file
    key: string; // S3 object key
}

/**
 * Check if S3/upload functionality is configured and available
 */
export function isUploadEnabled(): boolean {
    return !!(
        env.S3_ENDPOINT &&
        env.S3_ACCESS_KEY &&
        env.S3_SECRET_KEY &&
        env.S3_BUCKET
    );
}

/**
 * UploadService - Handles file uploads to S3/MinIO
 * Only works if AWS SDK is installed and S3 is configured
 * This service is decoupled and can be used anywhere (onboarding, profile updates, etc.)
 */
export class UploadService extends Service {
    private s3Client: any = null;
    private initialized: boolean = false;

    constructor(options: ServiceOptions = {}) {
        super(options);
    }

    /**
     * Lazy initialization of S3 client
     * Only initializes if AWS SDK is available and S3 is configured
     */
    private async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        if (!isUploadEnabled()) {
            throw new BadRequestError(
                'File upload is not configured. Please provide S3 configuration or use logoUrl instead.'
            );
        }

        try {
            // Dynamic import to avoid errors if AWS SDK is not installed
            const { S3Client } = await import('@aws-sdk/client-s3');
            
            this.s3Client = new S3Client({
                endpoint: env.S3_ENDPOINT!,
                region: env.S3_REGION,
                credentials: {
                    accessKeyId: env.S3_ACCESS_KEY!,
                    secretAccessKey: env.S3_SECRET_KEY!,
                },
                forcePathStyle: true, // Required for MinIO
            });

            this.initialized = true;
        } catch (error) {
            if ((error as any).code === 'ERR_MODULE_NOT_FOUND') {
                throw new BadRequestError(
                    'AWS SDK is not installed. Please install @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner, or use logoUrl instead.'
                );
            }
            throw error;
        }
    }

    /**
     * Upload a file to S3
     * @param options File upload options
     * @returns Public URL and S3 key
     */
    public async uploadFile(options: UploadFileOptions): Promise<UploadResult> {
        try {
            await this.initialize();

            const { PutObjectCommand } = await import('@aws-sdk/client-s3');
            const { file, filename, contentType, folder = 'uploads' } = options;

            // Generate unique filename with timestamp
            const timestamp = Date.now();
            const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
            const key = `${folder}/${timestamp}-${sanitizedFilename}`;

            // Convert File to Buffer if needed
            let buffer: Buffer;
            if (file instanceof File) {
                const arrayBuffer = await file.arrayBuffer();
                buffer = Buffer.from(arrayBuffer);
            } else {
                buffer = file;
            }

            // Upload to S3
            const command = new PutObjectCommand({
                Bucket: env.S3_BUCKET!,
                Key: key,
                Body: buffer,
                ContentType: contentType,
                ACL: 'public-read', // Make file publicly accessible
            });

            await this.s3Client.send(command);

            // Generate public URL
            const url = `${env.S3_ENDPOINT}/${env.S3_BUCKET}/${key}`;

            this.log('file_uploaded', { key, contentType, size: buffer.length });

            return { url, key };
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'UploadService.uploadFile' });
            
            // If it's already a BadRequestError (from initialize), rethrow it
            if (apiError instanceof BadRequestError) {
                throw apiError;
            }
            
            throw new ServerError('Failed to upload file', {
                metadata: { filename: options.filename },
            });
        }
    }

    /**
     * Generate a presigned URL for direct client uploads
     * @param key S3 object key
     * @param contentType Content type of the file
     * @param expiresIn Expiration time in seconds (default: 1 hour)
     * @returns Presigned URL
     */
    public async getPresignedUploadUrl(
        key: string,
        contentType: string,
        expiresIn: number = 3600
    ): Promise<string> {
        try {
            await this.initialize();

            const { PutObjectCommand } = await import('@aws-sdk/client-s3');
            const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

            const command = new PutObjectCommand({
                Bucket: env.S3_BUCKET!,
                Key: key,
                ContentType: contentType,
                ACL: 'public-read',
            });

            const url = await getSignedUrl(this.s3Client, command, { expiresIn });

            this.log('presigned_url_generated', { key, expiresIn });

            return url;
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'UploadService.getPresignedUploadUrl' });
            
            if (apiError instanceof BadRequestError) {
                throw apiError;
            }
            
            throw new ServerError('Failed to generate presigned URL');
        }
    }

    /**
     * Generate a presigned URL for downloading/viewing a file
     * @param key S3 object key
     * @param expiresIn Expiration time in seconds (default: 1 hour)
     * @returns Presigned URL
     */
    public async getPresignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
        try {
            await this.initialize();

            const { GetObjectCommand } = await import('@aws-sdk/client-s3');
            const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

            const command = new GetObjectCommand({
                Bucket: env.S3_BUCKET!,
                Key: key,
            });

            const url = await getSignedUrl(this.s3Client, command, { expiresIn });

            this.log('presigned_download_url_generated', { key, expiresIn });

            return url;
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'UploadService.getPresignedDownloadUrl' });
            
            if (apiError instanceof BadRequestError) {
                throw apiError;
            }
            
            throw new ServerError('Failed to generate presigned download URL');
        }
    }
}
