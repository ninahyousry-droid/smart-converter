export type ToolCategory = 'documents' | 'images' | 'developers';

export interface ToolItem {
  id: string;
  title: string;
  englishTitle: string;
  category: ToolCategory;
  shortDesc: string;
  longDesc: string;
  h1: string;
  h2: string;
  iconName: string;
  accept: string;
  outputFormat: string;
  badge?: string;
  keywords: string[];
  features: string[];
  howToSteps: string[];
  faq: { q: string; a: string }[];
}

export interface ConversionResult {
  blob?: Blob;
  dataUrl?: string;
  text?: string;
  fileName: string;
  fileSize?: number;
  previewUrl?: string;
  tableData?: Array<Record<string, unknown>>;
  jsonOutput?: string;
  stats?: {
    originalSize: number;
    convertedSize: number;
    ratio?: string;
  };
}
