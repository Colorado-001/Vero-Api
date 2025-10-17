import QRCode from "qrcode";
import type { QRCodeOptions, QRCodeResult } from "../../types/qr";
import winston from "winston";
import createLogger from "../../logging/logger.config";
import { Env } from "../../config/env";

export class QrGeneratorService {
  private defaultOptions: QRCodeOptions = {
    width: 256,
    height: 256,
    margin: 2,
    color: {
      light: "#0F1115", // background
      dark: "#FFFFFF",
    },
    errorCorrectionLevel: "M",
    svg: false,
  };

  private readonly logger: winston.Logger;

  constructor(config: Env) {
    this.logger = createLogger("QrGeneratorService", config);
  }

  async generateQRCode(
    text: string,
    options: QRCodeOptions = {}
  ): Promise<QRCodeResult | null> {
    const mergedOptions = { ...this.defaultOptions, ...options };

    try {
      // Generate data URL (base64)
      const dataUrl = await QRCode.toDataURL(text, mergedOptions);

      // Extract base64 image data from data URL
      const imageData = dataUrl.split(",")[1];

      // Generate SVG if needed
      let svgData: string | undefined;
      if (options.svg) {
        svgData = await QRCode.toString(text, {
          type: "svg",
          ...mergedOptions,
        });
      }

      return {
        imageData,
        svgData,
        dataUrl,
        text,
        timestamp: new Date(),
        options: mergedOptions,
      };
    } catch (error: any) {
      this.logger.error(`Failed to generate QR code: ${error.message}`, error);
      return null;
    }
  }

  async generateCryptoAddressQR(
    address: string,
    options: QRCodeOptions = {}
  ): Promise<QRCodeResult | null> {
    const formattedText = address.toLocaleLowerCase();

    return this.generateQRCode(formattedText, {
      width: 300,
      height: 300,
      margin: 3,
      errorCorrectionLevel: "Q", // Higher error correction for crypto addresses
      ...options,
    });
  }

  isQRCodeValid(qrCode: QRCodeResult, maxAgeMinutes: number = 60): boolean {
    const now = new Date();
    const age = now.getTime() - qrCode.timestamp.getTime();
    return age <= maxAgeMinutes * 60 * 1000;
  }
}
