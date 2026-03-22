"use client";

import { Download, Upload, FileText, Plus } from "lucide-react";
import Button from "./Button";

interface PageActionsProps {
  canCreate?: boolean;
  canImport?: boolean;
  canExport?: boolean;
  onCreateClick?: () => void;
  onExcelDownload?: () => void;
  onExcelUpload?: () => void;
  onPdfPrint?: () => void;
  createLabel?: string;
}

export default function PageActions({
  canCreate,
  canImport,
  canExport = true,
  onCreateClick,
  onExcelDownload,
  onExcelUpload,
  onPdfPrint,
  createLabel = "등록",
}: PageActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {canExport && onPdfPrint && (
        <Button variant="ghost" size="sm" onClick={onPdfPrint} title="PDF 출력">
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">PDF</span>
        </Button>
      )}
      {canExport && onExcelDownload && (
        <Button variant="ghost" size="sm" onClick={onExcelDownload} title="엑셀 다운로드">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">엑셀</span>
        </Button>
      )}
      {canImport && onExcelUpload && (
        <Button variant="outline" size="sm" onClick={onExcelUpload} title="엑셀 업로드">
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">업로드</span>
        </Button>
      )}
      {canCreate && onCreateClick && (
        <Button size="sm" onClick={onCreateClick}>
          <Plus className="h-4 w-4" />
          {createLabel}
        </Button>
      )}
    </div>
  );
}
