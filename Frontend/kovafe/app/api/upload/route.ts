import { errorResponse, json } from "@/lib/server/api";
import { pinata } from "@/lib/server/pinata";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
]);

const MAX_SIZE_BYTES = 50 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return errorResponse("Missing file", 400);
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return errorResponse("Unsupported file type", 400);
    }

    if (file.size > MAX_SIZE_BYTES) {
      return errorResponse("File exceeds 50MB limit", 400);
    }

    const result = await pinata.upload.file(file);
    const cid = (result as { IpfsHash?: string }).IpfsHash;

    if (!cid) {
      throw new Error("Pinata upload did not return a CID");
    }

    return json({
      cid,
      url: `https://jade-obvious-goose-24.mypinata.cloud/ipfs/${cid}`,
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Upload failed",
    );
  }
}
