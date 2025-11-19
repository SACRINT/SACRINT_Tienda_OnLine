// Storage Service Integration
// File upload and management

import { z } from "zod";

// Upload schemas
export const UploadOptionsSchema = z.object({
  folder: z.string().optional(),
  filename: z.string().optional(),
  contentType: z.string().optional(),
  public: z.boolean().optional(),
  maxSize: z.number().optional(), // bytes
  allowedTypes: z.array(z.string()).optional(),
});

export type UploadOptions = z.infer<typeof UploadOptionsSchema>;

export interface UploadResult {
  url: string;
  key: string;
  size: number;
  contentType: string;
}

export interface StorageService {
  upload(file: File | Buffer, options?: UploadOptions): Promise<UploadResult>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
  list(prefix?: string): Promise<string[]>;
}

// Cloudinary implementation
export class CloudinaryStorageService implements StorageService {
  private cloudName: string;
  private apiKey: string;
  private apiSecret: string;

  constructor(cloudName: string, apiKey: string, apiSecret: string) {
    this.cloudName = cloudName;
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  async upload(
    file: File | Buffer,
    options?: UploadOptions
  ): Promise<UploadResult> {
    // Validate file
    if (options?.maxSize) {
      const size = file instanceof File ? file.size : file.length;
      if (size > options.maxSize) {
        throw new Error(`File size exceeds limit of ${options.maxSize} bytes`);
      }
    }

    if (options?.allowedTypes && file instanceof File) {
      if (!options.allowedTypes.includes(file.type)) {
        throw new Error(`File type ${file.type} not allowed`);
      }
    }

    // Prepare form data
    const formData = new FormData();

    if (file instanceof File) {
      formData.append("file", file);
    } else {
      formData.append("file", new Blob([file]));
    }

    formData.append("upload_preset", "ml_default");

    if (options?.folder) {
      formData.append("folder", options.folder);
    }

    if (options?.filename) {
      formData.append("public_id", options.filename);
    }

    // Upload to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Upload failed: ${error.error?.message || response.statusText}`);
    }

    const result = await response.json();

    return {
      url: result.secure_url,
      key: result.public_id,
      size: result.bytes,
      contentType: `image/${result.format}`,
    };
  }

  async delete(key: string): Promise<void> {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = this.generateSignature(`public_id=${key}&timestamp=${timestamp}`);

    const formData = new FormData();
    formData.append("public_id", key);
    formData.append("timestamp", timestamp.toString());
    formData.append("api_key", this.apiKey);
    formData.append("signature", signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/image/destroy`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.statusText}`);
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const timestamp = Math.floor(Date.now() / 1000) + expiresIn;
    const signature = this.generateSignature(`expires_at=${timestamp}&public_id=${key}`);

    return `https://res.cloudinary.com/${this.cloudName}/image/upload/s--${signature}--/${key}`;
  }

  async list(prefix?: string): Promise<string[]> {
    // Cloudinary Admin API would be needed for listing
    console.warn("Cloudinary list not implemented");
    return [];
  }

  private generateSignature(params: string): string {
    // In production, use crypto for HMAC-SHA1
    return Buffer.from(`${params}${this.apiSecret}`).toString("base64").slice(0, 8);
  }
}

// S3-compatible storage implementation
export class S3StorageService implements StorageService {
  private bucket: string;
  private region: string;
  private accessKeyId: string;
  private secretAccessKey: string;

  constructor(
    bucket: string,
    region: string,
    accessKeyId: string,
    secretAccessKey: string
  ) {
    this.bucket = bucket;
    this.region = region;
    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
  }

  async upload(
    file: File | Buffer,
    options?: UploadOptions
  ): Promise<UploadResult> {
    // Validate file
    if (options?.maxSize) {
      const size = file instanceof File ? file.size : file.length;
      if (size > options.maxSize) {
        throw new Error(`File size exceeds limit`);
      }
    }

    // Generate key
    const key = options?.folder
      ? `${options.folder}/${options.filename || Date.now()}`
      : options?.filename || `${Date.now()}`;

    // In production, use AWS SDK
    // This is a simplified example
    const endpoint = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

    const body = file instanceof File ? await file.arrayBuffer() : file;

    const response = await fetch(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": options?.contentType || "application/octet-stream",
        // Add AWS Signature headers here
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`S3 upload failed: ${response.statusText}`);
    }

    return {
      url: endpoint,
      key,
      size: file instanceof File ? file.size : file.length,
      contentType: options?.contentType || "application/octet-stream",
    };
  }

  async delete(key: string): Promise<void> {
    const endpoint = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

    const response = await fetch(endpoint, {
      method: "DELETE",
      // Add AWS Signature headers
    });

    if (!response.ok) {
      throw new Error(`S3 delete failed: ${response.statusText}`);
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    // Generate presigned URL with AWS SDK
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}?signed=true`;
  }

  async list(prefix?: string): Promise<string[]> {
    // List objects with AWS SDK
    return [];
  }
}

// Create storage service
export function createStorageService(): StorageService {
  const provider = process.env.STORAGE_PROVIDER || "cloudinary";

  if (provider === "cloudinary") {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.warn("Cloudinary config missing, using mock storage");
      return new MockStorageService();
    }

    return new CloudinaryStorageService(cloudName, apiKey, apiSecret);
  }

  if (provider === "s3") {
    const bucket = process.env.S3_BUCKET;
    const region = process.env.S3_REGION || "us-east-1";
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

    if (!bucket || !accessKeyId || !secretAccessKey) {
      console.warn("S3 config missing, using mock storage");
      return new MockStorageService();
    }

    return new S3StorageService(bucket, region, accessKeyId, secretAccessKey);
  }

  return new MockStorageService();
}

// Mock service for development
class MockStorageService implements StorageService {
  private files = new Map<string, UploadResult>();

  async upload(
    file: File | Buffer,
    options?: UploadOptions
  ): Promise<UploadResult> {
    const key = options?.filename || `mock_${Date.now()}`;
    const result: UploadResult = {
      url: `https://mock-storage.example.com/${key}`,
      key,
      size: file instanceof File ? file.size : file.length,
      contentType: options?.contentType || "application/octet-stream",
    };

    this.files.set(key, result);
    console.log("Mock storage upload:", key);

    return result;
  }

  async delete(key: string): Promise<void> {
    this.files.delete(key);
    console.log("Mock storage delete:", key);
  }

  async getSignedUrl(key: string): Promise<string> {
    return `https://mock-storage.example.com/${key}?signed=true`;
  }

  async list(prefix?: string): Promise<string[]> {
    return Array.from(this.files.keys()).filter((key) =>
      prefix ? key.startsWith(prefix) : true
    );
  }
}

export const storage = createStorageService();
