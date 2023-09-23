import { PutBlobResult, del, put } from "@vercel/blob";
import mongoose from "mongoose";
import path from "path";
import sharp from "sharp";

interface ReturnFile {
  url: string;
}

export interface IFileService {
  saveProfilePic(
    file: Express.Multer.File,
    userId: mongoose.Types.ObjectId
  ): Promise<ReturnFile>;
  saveFeaturedImage(
    file: Express.Multer.File,
    blogPostId: mongoose.Types.ObjectId
  ): Promise<ReturnFile>;
  saveInPostImage(file: Express.Multer.File): Promise<ReturnFile>;
  removeFile(url: string): Promise<void>;
}

export default class FileService implements IFileService {
  private async bufferImage(
    file: Express.Multer.File,
    width?: number,
    height?: number,
    withoutEnlargement: boolean = false
  ) {
    const buffer = await sharp(file.buffer)
      .resize(width, height, {
        withoutEnlargement,
      })
      .toBuffer();
    return buffer;
  }

  private async saveImage(
    buffer: Buffer,
    path: string,
    addRandomSuffix: boolean = false
  ): Promise<PutBlobResult> {
    const savedFile = await put(path, buffer, {
      access: "public",
      addRandomSuffix,
    });
    return savedFile;
  }

  async saveProfilePic(
    file: Express.Multer.File,
    userId: mongoose.Types.ObjectId
  ): Promise<ReturnFile> {
    const buffer = await this.bufferImage(file, 500, 500, true);
    const guy = await this.saveImage(buffer, `profile-pictures/${userId}.png`);
    return { url: guy.url };
  }

  async saveFeaturedImage(
    file: Express.Multer.File,
    blogPostId: mongoose.Types.ObjectId
  ): Promise<ReturnFile> {
    const buffer = await this.bufferImage(file, 700, 450);
    const image = await this.saveImage(
      buffer,
      `featured-images/${blogPostId}.png`
    );
    return { url: image.url };
  }

  async saveInPostImage(file: Express.Multer.File): Promise<ReturnFile> {
    const buffer = await this.bufferImage(file, 1920, undefined, true);
    const imageDestinationPath = `in-post-images/${path.extname(
      file.originalname
    )}.png`;

    const image = await this.saveImage(buffer, imageDestinationPath, true);
    return { url: image.url };
  }

  async removeFile(url: string): Promise<void> {
    await del(url);
  }
}
