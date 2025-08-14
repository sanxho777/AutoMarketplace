import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

interface ProcessedImage {
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  base64: string;
  url: string;
}

export class ImageProcessor {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), "uploads", "vehicles");
  }

  async processUploadedImage(
    buffer: Buffer,
    originalName: string,
    mimetype: string
  ): Promise<ProcessedImage> {
    // Ensure upload directory exists
    await mkdir(this.uploadDir, { recursive: true });

    // Generate unique filename
    const ext = path.extname(originalName);
    const filename = `${randomUUID()}${ext}`;
    const filepath = path.join(this.uploadDir, filename);

    // Write file to disk
    await writeFile(filepath, buffer);

    // Convert to base64 for AI processing
    const base64 = buffer.toString("base64");

    return {
      filename,
      originalName,
      size: buffer.length,
      mimetype,
      base64,
      url: `/uploads/vehicles/${filename}`,
    };
  }

  validateImageFile(mimetype: string, size: number): void {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(mimetype.toLowerCase())) {
      throw new Error("Invalid file type. Only JPEG, PNG, and WEBP images are allowed.");
    }

    if (size > maxSize) {
      throw new Error("File too large. Maximum size is 10MB.");
    }
  }

  async optimizeImage(buffer: Buffer): Promise<Buffer> {
    // For now, just return the original buffer
    // In a real implementation, you could use Sharp or similar to:
    // - Resize large images
    // - Compress images
    // - Convert to optimal formats
    return buffer;
  }
}

export const imageProcessor = new ImageProcessor();
