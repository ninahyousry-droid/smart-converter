import React from 'react';
import {
  FileText, FileEdit, FileSpreadsheet, Table, Presentation, Layers,
  Scissors, Minimize2, FileCode2, Images, RotateCw, Hash, Code,
  Smartphone, ImagePlus, RefreshCw, Cpu, Maximize, Crop, FileCode,
  Image as ImageIcon, Eraser, Binary, Palette, Globe, ShieldAlert,
  Wand2, FileJson, ArrowRightLeft, TableProperties, Lock, Fingerprint,
  Database, QrCode, SplitSquareVertical, LucideIcon
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  FileText,
  FileEdit,
  Sheet: FileSpreadsheet,
  Table,
  Presentation,
  Layers,
  Scissors,
  Minimize2,
  FileCode2,
  Images,
  RotateCw,
  Hash,
  Code,
  Smartphone,
  ImagePlus,
  RefreshCw,
  Cpu,
  Maximize,
  Crop,
  FileCode,
  Image: ImageIcon,
  Eraser,
  Binary,
  Palette,
  Globe,
  ShieldAlert,
  Wand2,
  FileJson,
  FileSpreadsheet,
  ArrowRightLeft,
  TableProperties,
  Lock,
  Fingerprint,
  Database,
  QrCode,
  SplitSquareVertical,
};

export const ToolIcon: React.FC<{ name: string; className?: string }> = ({ name, className = 'w-6 h-6' }) => {
  const IconComponent = ICON_MAP[name] || FileText;
  return <IconComponent className={className} />;
};
