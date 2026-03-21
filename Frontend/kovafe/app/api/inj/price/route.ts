import { errorResponse, json } from "@/lib/server/api";

export async function GET() {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=injective-protocol&vs_currencies=usd&x_cg_demo_api_key=CG-7hxGTpJRsggihz8uKnCZErmX",
      {
        next: { revalidate: 60 },
      },
    );

    if (!response.ok) {
      throw new Error(`CoinGecko request failed: ${response.status}`);
    }

    const payload = await response.json();

    return json({
      usd: payload["injective-protocol"]?.usd ?? 0,
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to fetch INJ price",
    );
  }
}
