import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { env } from "./env.js";

function normalizeEndpoint(endpoint) {
  if (!endpoint) {
    return "";
  }

  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }

  return `https://${endpoint}`;
}

function assertB2Config() {
  if (!env.B2_ENDPOINT || !env.B2_KEY_ID || !env.B2_APP_KEY || !env.B2_BUCKET) {
    throw new Error("Configuration Backblaze B2 manquante.");
  }
}

const b2Client = new S3Client({
  region: "us-east-1",
  endpoint: normalizeEndpoint(env.B2_ENDPOINT),
  credentials: {
    accessKeyId: env.B2_KEY_ID,
    secretAccessKey: env.B2_APP_KEY,
  },
  forcePathStyle: true,
});

export async function uploadToB2({ key, body, contentType }) {
  assertB2Config();

  await b2Client.send(
    new PutObjectCommand({
      Bucket: env.B2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function downloadFromB2(key) {
  assertB2Config();

  return b2Client.send(
    new GetObjectCommand({
      Bucket: env.B2_BUCKET,
      Key: key,
    })
  );
}

export async function deleteFromB2(key) {
  assertB2Config();

  await b2Client.send(
    new DeleteObjectCommand({
      Bucket: env.B2_BUCKET,
      Key: key,
    })
  );
}
