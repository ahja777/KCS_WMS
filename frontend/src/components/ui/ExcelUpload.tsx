"use client";

import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, X, AlertCircle, CheckCircle } from "lucide-react";
import Button from "./Button";
import Modal from "./Modal";

interface ExcelUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<{ success: boolean; message: string; count?: number }>;
  title?: string;
  templateColumns?: string[];
  accept?: string;
}

export default function ExcelUpload({
  isOpen,
  onClose,
  onUpload,
  title = "엑셀 업로드",
  templateColumns,
  accept = ".xlsx,.xls,.csv",
}: ExcelUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setResult(null);
    try {
      const res = await onUpload(file);
      setResult(res);
      if (res.success) {
        setFile(null);
        if (fileRef.current) fileRef.current.value = "";
      }
    } catch (err: unknown) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="md">
      <div className="space-y-5">
        {/* Drop zone */}
        <div
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E5E8EB] bg-[#F7F8FA] p-8 transition-colors hover:border-[#3182F6] hover:bg-[#F2F4F6]"
          onClick={() => fileRef.current?.click()}
          style={{ cursor: "pointer" }}
        >
          <Upload className="mb-3 h-10 w-10 text-[#B0B8C1]" />
          <p className="text-sm font-medium text-[#4E5968]">
            클릭하여 파일을 선택하세요
          </p>
          <p className="mt-1 text-xs text-[#8B95A1]">.xlsx, .xls, .csv</p>
          <input
            ref={fileRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Selected file */}
        {file && (
          <div className="flex items-center gap-3 rounded-xl bg-[#E8F3FF] p-4">
            <FileSpreadsheet className="h-5 w-5 text-[#3182F6]" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[#191F28]">{file.name}</p>
              <p className="text-xs text-[#8B95A1]">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              onClick={() => {
                setFile(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="rounded-lg p-1 text-[#8B95A1] hover:bg-[#F2F4F6]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Template info */}
        {templateColumns && (
          <div className="rounded-xl bg-[#F7F8FA] p-4">
            <p className="mb-2 text-xs font-semibold text-[#8B95A1]">필수 컬럼</p>
            <div className="flex flex-wrap gap-1.5">
              {templateColumns.map((col) => (
                <span
                  key={col}
                  className="rounded-md bg-white px-2 py-1 text-xs font-medium text-[#4E5968] shadow-sm"
                >
                  {col}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div
            className={`flex items-center gap-3 rounded-xl p-4 text-sm ${
              result.success
                ? "bg-[#E8F7EF] text-[#1FC47D]"
                : "bg-[#FFEAED] text-[#F04452]"
            }`}
          >
            {result.success ? (
              <CheckCircle className="h-5 w-5 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0" />
            )}
            <span>
              {result.message}
              {result.count !== undefined && ` (${result.count}건)`}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={handleClose}>
            닫기
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file}
            isLoading={isUploading}
          >
            <Upload className="h-4 w-4" />
            업로드
          </Button>
        </div>
      </div>
    </Modal>
  );
}
