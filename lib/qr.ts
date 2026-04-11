import QRCode from "qrcode";

/**
 * Generate QR code as SVG string
 */
export async function generateQrSvg(
  data: string,
  options: {
    width?: number;
    margin?: number;
    color?: { dark?: string; light?: string };
  } = {}
): Promise<string> {
  return QRCode.toString(data, {
    type: "svg",
    width: options.width || 300,
    margin: options.margin ?? 2,
    color: {
      dark: options.color?.dark || "#1E293B",
      light: options.color?.light || "#FFFFFF",
    },
    errorCorrectionLevel: "H", // High — allows logo overlay
  });
}

/**
 * Generate QR code as Data URL (base64 PNG)
 */
export async function generateQrDataUrl(
  data: string,
  options: {
    width?: number;
    margin?: number;
    color?: { dark?: string; light?: string };
  } = {}
): Promise<string> {
  return QRCode.toDataURL(data, {
    width: options.width || 300,
    margin: options.margin ?? 2,
    color: {
      dark: options.color?.dark || "#1E293B",
      light: options.color?.light || "#FFFFFF",
    },
    errorCorrectionLevel: "H",
  });
}

/**
 * Generate QR code as PNG buffer (for saving)
 */
export async function generateQrBuffer(
  data: string,
  options: {
    width?: number;
    margin?: number;
  } = {}
): Promise<Buffer> {
  return QRCode.toBuffer(data, {
    width: options.width || 300,
    margin: options.margin ?? 2,
    errorCorrectionLevel: "H",
  });
}
