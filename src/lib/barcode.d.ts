// BarcodeDetector is available in Chromium-based browsers but not yet in TS DOM libs.
interface BarcodeDetectorResult {
  rawValue: string;
  format?: string;
}

interface BarcodeDetectorOptions {
  formats?: string[];
}

declare class BarcodeDetector {
  constructor(options?: BarcodeDetectorOptions);
  static getSupportedFormats(): Promise<string[]>;
  detect(source: CanvasImageSource): Promise<BarcodeDetectorResult[]>;
}

interface Window {
  BarcodeDetector?: typeof BarcodeDetector;
}
