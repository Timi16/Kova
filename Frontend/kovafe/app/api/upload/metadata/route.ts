import { errorResponse, json } from "@/lib/server/api";
import { pinata } from "@/lib/server/pinata";

type MetadataBody = {
  name?: string;
  description?: string;
  image?: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MetadataBody;

    if (!body.name || !body.image) {
      return errorResponse("Metadata name and image are required", 400);
    }

    const result = await pinata.upload.json(body) as unknown as { cid: string; IpfsHash: string };
    const cid = result.cid ?? result.IpfsHash;

    if (!cid) {
      throw new Error("Pinata metadata upload did not return a CID");
    }

    return json({
      cid,
      url: `https://jade-obvious-goose-24.mypinata.cloud/ipfs/${cid}`,
    });
  } catch (error) {
    console.error("Pinata metadata error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Metadata upload failed",
    );
  }
}