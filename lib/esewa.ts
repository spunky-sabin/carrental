import crypto from "crypto";

export interface EsewaPaymentConfig {
  productCode: string;
  secretKey: string;
  gatewayUrl: string;
}

export function getEsewaConfig(): EsewaPaymentConfig {
  return {
    productCode: process.env.ESEWA_PRODUCT_CODE || "EPAYTEST",
    secretKey: process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q",
    gatewayUrl: process.env.ESEWA_GATEWAY_URL || "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
  };
}

export function generateEsewaSignature(
  totalAmount: string,
  transactionUuid: string,
  productCode: string
): string {
  const { secretKey } = getEsewaConfig();
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  
  console.log("================ [eSewa Signature Generation] ================");
  console.log("HMAC Secret Key:      ", secretKey);
  console.log("Raw Message String:   ", message);
  
  const hmac = crypto.createHmac("sha256", secretKey);
  hmac.update(message);
  const signature = hmac.digest("base64");
  
  console.log("Generated Signature:  ", signature);
  console.log("===============================================================");
  return signature;
}

export interface EsewaFormData {
  amount: string;
  tax_amount: string;
  total_amount: string;
  transaction_uuid: string;
  product_code: string;
  product_service_charge: string;
  product_delivery_charge: string;
  success_url: string;
  failure_url: string;
  signed_field_names: string;
  signature: string;
  action_url: string;
}

export function buildEsewaPayload({
  bookingId,
  carId,
  amountNpr,
  origin,
  extensionId,
}: {
  bookingId: number;
  carId: number;
  amountNpr: number;
  origin: string;
  extensionId?: number;
}): EsewaFormData {
  const config = getEsewaConfig();
  const numAmount = Number(amountNpr);
  const formattedAmount = Number.isInteger(numAmount)
    ? numAmount.toString()
    : numAmount.toFixed(2);
  
  // For extensions: EXT_<extensionId>_<bookingId>_<carId>_<timestamp>_<random>
  // For regular bookings: ORD_<bookingId>_<carId>_<timestamp>_<random>
  const transactionUuid = extensionId
    ? `EXT_${extensionId}_${bookingId}_${carId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    : `ORD_${bookingId}_${carId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const signature = generateEsewaSignature(
    formattedAmount,
    transactionUuid,
    config.productCode
  );

  const successUrl = extensionId
    ? `${origin}/api/payments/esewa/extension-callback`
    : `${origin}/api/payments/esewa/callback`;
  const failureUrl = extensionId
    ? `${origin}/api/payments/cancel?booking_id=${bookingId}&extension_id=${extensionId}`
    : `${origin}/api/payments/cancel`;

  const payload: EsewaFormData = {
    amount: formattedAmount,
    tax_amount: "0",
    total_amount: formattedAmount,
    transaction_uuid: transactionUuid,
    product_code: config.productCode,
    product_service_charge: "0",
    product_delivery_charge: "0",
    success_url: successUrl,
    failure_url: failureUrl,
    signed_field_names: "total_amount,transaction_uuid,product_code",
    signature,
    action_url: config.gatewayUrl,
  };

  console.log("================ [eSewa Form Payload] ================");
  console.log("Form Payload Data:", JSON.stringify(payload, null, 2));
  console.log("======================================================");

  return payload;
}

export interface EsewaCallbackPayload {
  transaction_code?: string;
  status?: string;
  total_amount?: number | string;
  transaction_uuid?: string;
  product_code?: string;
  signed_field_names?: string;
  signature?: string;
}

export function parseEsewaResponse(dataBase64: string): EsewaCallbackPayload | null {
  try {
    const decodedJson = Buffer.from(dataBase64, "base64").toString("utf-8");
    console.log("================ [eSewa Callback Data Decoded] ================");
    console.log("Raw Base64: ", dataBase64);
    console.log("Decoded JSON:", decodedJson);
    console.log("===============================================================");
    return JSON.parse(decodedJson) as EsewaCallbackPayload;
  } catch (err) {
    console.error("Failed to parse eSewa callback data:", err);
    return null;
  }
}

export async function verifyEsewaStatusApi({
  productCode,
  totalAmount,
  transactionUuid,
}: {
  productCode: string;
  totalAmount: string | number;
  transactionUuid: string;
}): Promise<{ status: string; ref_id: string | null } | null> {
  try {
    const config = getEsewaConfig();
    const isSandbox = config.gatewayUrl.includes("rc-epay");
    const statusApiUrl = isSandbox
      ? `https://rc-epay.esewa.com.np/api/epay/transaction/status/?product_code=${encodeURIComponent(productCode)}&total_amount=${encodeURIComponent(totalAmount)}&transaction_uuid=${encodeURIComponent(transactionUuid)}`
      : `https://epay.esewa.com.np/api/epay/transaction/status/?product_code=${encodeURIComponent(productCode)}&total_amount=${encodeURIComponent(totalAmount)}&transaction_uuid=${encodeURIComponent(transactionUuid)}`;

    console.log("================ [eSewa Status API Check] ================");
    console.log("Status API URL:", statusApiUrl);

    const response = await fetch(statusApiUrl);
    if (!response.ok) {
      console.log("Status API Response NOT OK:", response.status, response.statusText);
      return null;
    }
    const data = await response.json();
    console.log("Status API Response Data:", JSON.stringify(data, null, 2));
    console.log("==========================================================");

    return {
      status: data.status,
      ref_id: data.ref_id || null,
    };
  } catch (err) {
    console.error("eSewa Status API check failed:", err);
    return null;
  }
}
