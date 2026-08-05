import { PayBridgeNP } from "@paybridge-np/sdk";

export function getPayBridgeClient() {
  const apiKey = process.env.WALLET_API_KEY || process.env.PAYBRIDGENP_API_KEY;
  if (!apiKey) {
    throw new Error("WALLET_API_KEY or PAYBRIDGENP_API_KEY environment variable is not set");
  }
  const client = new PayBridgeNP({ apiKey });

  // Attach createSession alias to client.checkout for compatibility
  if (client.checkout && !("createSession" in client.checkout)) {
    (client.checkout as any).createSession = (params: any) => client.checkout.create(params);
  }

  return client;
}
