import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Config: any = { region: process.env.AWS_REGION || 'us-east-1' };
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3Config.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

const s3Client = new S3Client(s3Config);
const BUCKET = process.env.AWS_BUCKET_NAME!;
const SIGNED_URL_TTL = 3600; // 1 hour

function sanitizeFileName(fileName: string): string {
  const basename = fileName.split(/[\\/]/).pop() || 'upload';
  return basename.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 100);
}

export async function uploadToS3(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  coralId: string
): Promise<string> {
  const key = `corals/${coralId}/${Date.now()}-${sanitizeFileName(fileName)}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'private',
    })
  );

  return key;
}

export async function uploadProfileImageToS3(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  userId: string
): Promise<string> {
  const key = `users/${userId}/${Date.now()}-${sanitizeFileName(fileName)}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'private',
    })
  );

  return key;
}

export async function uploadAquariumImageToS3(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  aquariumId: string
): Promise<string> {
  const key = `aquariums/${aquariumId}/${Date.now()}-${sanitizeFileName(fileName)}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'private',
    })
  );

  return key;
}

export async function getSignedImageUrl(key: string): Promise<string> {
  return getSignedUrl(
    s3Client,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: SIGNED_URL_TTL }
  );
}

export async function deleteFromS3(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({ Bucket: BUCKET, Key: key })
  );
}
