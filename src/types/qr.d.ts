export interface QRCodeOptions {
  width?: number;
  height?: number;
  margin?: number;
  color?: {
    dark: string;
    light: string;
  };
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  svg?: boolean;
}

export interface QRCodeResult {
  imageData: string; // Base64 encoded image data
  svgData?: string; // SVG string if requested
  dataUrl: string; // Data URL for direct use in img src
  text: string; // Original text that was encoded
  timestamp: Date;
  options: QRCodeOptions;
}
