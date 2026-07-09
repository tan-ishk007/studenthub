import { cloudinary } from "../../config/cloudinary.js";

/**
 * Clean & Minimalist Signed Upload Bypass
 */
export async function uploadBufferToCloudinary(buffer, { extension }) {
  const extLower = extension ? extension.toLowerCase() : "";
  // PDF handles cleanly as 'image' type inside Cloudinary asset store
  const resourceType = extLower === "pdf" || ["jpg", "jpeg", "png"].includes(extLower) ? "image" : "raw";
  
  const base64Data = buffer.toString("base64");
  const mimeType = resourceType === "image" && extLower === "pdf" ? "application/pdf" : "application/octet-stream";
  const dataURI = `data:${mimeType};base64,${base64Data}`;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  const timestamp = Math.round(new Date().getTime() / 1000);
  
  // 🔥 Strict Minimalist Signature Params (Bypassing Nested Folder Validations)
  const signParams = {
    timestamp: timestamp
  };

  if (extLower === "pdf") {
    signParams.format = "pdf";
  }

  const signature = cloudinary.utils.api_sign_request(signParams, apiSecret);

  const bodyData = new URLSearchParams();
  bodyData.append("file", dataURI);
  bodyData.append("api_key", apiKey);
  bodyData.append("timestamp", timestamp.toString());
  bodyData.append("signature", signature);
  if (extLower === "pdf") {
    bodyData.append("format", "pdf");
  }

  // Target endpoint mapping
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  const response = await fetch(url, {
    method: "POST",
    body: bodyData,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  });

  const text = await response.text();

console.log("========== CLOUDINARY RESPONSE ==========");
console.log("URL:", url);
console.log("STATUS:", response.status);
console.log("BODY:", text);
console.log("=========================================");

let result = {};
try {
  result = JSON.parse(text);
} catch {}

if (!response.ok) {
  throw new Error(text);
}

  return result;
}
