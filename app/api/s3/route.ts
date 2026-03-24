import { NextResponse } from "next/server";
import z from "zod";
import { v4 as uuidv4 } from "uuid";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "@/lib/s3client";

const uploadSchema = z.object({
  fileName: z.string(),
  size: z.number(),
  contentType: z.string(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = uploadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { fileName, contentType } = validation.data;

    // key used in bucket
    const uniqueKey = `${uuidv4()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: uniqueKey,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(s3, command, {
      expiresIn: 360, // seconds
    });

    // public URL (works if bucket is public)
    const bucketBaseUrl = `https://t3.storage.dev/${process.env.AWS_BUCKET_NAME}`;
    const fileUrl = `${bucketBaseUrl}/${uniqueKey}`;

    return NextResponse.json(
      { presignedUrl, uniqueKey, fileUrl },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
