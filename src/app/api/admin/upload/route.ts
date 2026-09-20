import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { randomBytes } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const hasCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET,
);

function uploadToCloudinary(buffer: Buffer): Promise<string> {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "pakeeza-fashion/products", resource_type: "image", format: "webp" },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error ?? new Error("Cloudinary did not return an image URL"));
          return;
        }
        resolve(result.secure_url);
      },
    );
    stream.end(buffer);
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large — max 5MB" }, { status: 400 });
  }
  // Trust neither the client-reported MIME type nor the filename/extension —
  // sniff the real content below via sharp, which will throw on anything
  // that isn't a genuine, decodable image (blocks disguised executables,
  // SVG/XML with embedded scripts, polyglot files, etc).
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG or WebP images are allowed" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let metadata;
  try {
    metadata = await sharp(buffer).metadata();
    if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format)) {
      throw new Error("unrecognized image format");
    }
  } catch {
    return NextResponse.json({ error: "File is not a valid image" }, { status: 400 });
  }

  // Re-encode through sharp rather than saving the original bytes — this
  // strips any non-image payload smuggled inside a technically-valid image
  // container, and normalizes output to webp.
  try {
    const normalized = await sharp(buffer, { failOn: "none" })
      .rotate()
      .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
      .toColorspace("srgb")
      .webp({ quality: 82 })
      .toBuffer();

    if (hasCloudinary) {
      return NextResponse.json({ url: await uploadToCloudinary(normalized) });
    }

    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Image storage is not configured. Add the Cloudinary environment variables in your hosting provider." },
        { status: 503 },
      );
    }

    const safeFilename = `${randomBytes(16).toString("hex")}.webp`;
    await mkdir(UPLOAD_DIR, { recursive: true });
    const outPath = path.join(UPLOAD_DIR, safeFilename);
    if (!outPath.startsWith(UPLOAD_DIR)) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }
    await writeFile(outPath, normalized);
    return NextResponse.json({ url: `/uploads/${safeFilename}` });
  } catch (error) {
    console.error("Admin image upload failed", error);
    return NextResponse.json(
      { error: hasCloudinary ? "The image could not be uploaded to Cloudinary. Check the Cloudinary settings." : "The image could not be saved. Check that the uploads folder is writable and try again." },
      { status: 500 },
    );
  }
}
