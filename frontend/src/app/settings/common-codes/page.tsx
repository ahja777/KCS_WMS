"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  useCommonCodes,
  useCreateCommonCode,
  useUpdateCommonCode,
  useDeleteCommonCode,
} from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import type { CommonCode } from "@/types";

const codeSchema = z.object({
  codeType: z.string().min(1, "코드유형을 입력해주세요"),
  typeNm: z.string().optional(),
  code: z.string().min(1, "코드를 입력해주세요"),
  codeNm: z.string().min(1, "코드명을 입력해주세요"),
  value: z.string().optional(),
  sortOrder: z.coerce.number().min(0),
  isActive: z.boolean(),
});

type CodeFormData = z.infer<typeof codeSchema>;

const inputBase =
  "w-full rounded border border-[#D1D6DB] bg-white px-3 py-2 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6]/20";

const selectBase =
  "rounded border border-[#D1D6DB] bg-white px-3 py-2 text-sm text-[#191F28] outline-none focus:border-[#3182F6] focus:ring-1 focus:ring-[#3182F6]/20";

type GroupRow = {
  codeType: string;
  typeNm: string;
  userType: string;
  codeLevel: string;
};

export default function CommonCodesPage() {
  const [searchGroupCode, setSearchGroupCode] = useState("");
  const [searchGroupName, setSearchGroupName] = useState("");
  const [searchUserType, setSearchUserType] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [leftPage, setLeftPage] = useState(1);
  const [rightPage, setRightPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isRightFormOpen, setIsRightFormOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<CommonCode | undefined>();
  const [deletingCode, setDeletingCode] = useState<CommonCode | undefined>();
  const [leftChecked, setLeftChecked] = useState<Set<string>>(new Set());
  const [rightChecked, setRightChecked] = useState<Set<string>>(new Set());

  const addToast = useToastStore((s) => s.addToast);

  const { data: response, isLoading, error } = useCommonCodes({
    page: 1,
    limit: 500,
  });

  const deleteMutation = useDeleteCommonCode();

  const codes = response?.data ?? [];

  // Build left-panel group rows
  const groupRows = useMemo(() => {
    const map = new Map<string, GroupRow>();
    for (const c of codes) {
      if (!map.has(c.codeType)) {
        map.set(c.codeType, {
          codeType: c.codeType,
          typeNm: c.typeNm ?? "",
          userType: "마스터",
          codeLevel: "삭제불가",
        });
      }
    }
    let result = Array.from(map.values());
    if (searchGroupCode) {
      result = result.filter((r) => r.codeType.toLowerCase().includes(searchGroupCode.toLowerCase()));
    }
    if (searchGroupName) {
      result = result.filter((r) => r.typeNm.toLowerCase().includes(searchGroupName.toLowerCase()));
    }
    if (searchUserType) {
      result = result.filter((r) => r.userType === searchUserType);
    }
    return result;
  }, [codes, searchGroupCode, searchGroupName, searchUserType]);

  // Right panel: codes filtered by selected group
  const rightCodes = useMemo(() => {
    if (!selectedGroup) return [];
    return codes.filter((c) => c.codeType === selectedGroup);
  }, [codes, selectedGroup]);

  // Pagination
  const leftPerPage = 20;
  const leftTotalPages = Math.max(1, Math.ceil(groupRows.length / leftPerPage));
  const leftPagedData = groupRows.slice((leftPage - 1) * leftPerPage, leftPage * leftPerPage);
  const leftStart = groupRows.length > 0 ? (leftPage - 1) * leftPerPage + 1 : 0;
  const leftEnd = Math.min(leftPage * leftPerPage, groupRows.length);

  const rightPerPage = 20;
  const rightTotalPages = Math.max(1, Math.ceil(rightCodes.length / rightPerPage));
  const rightPagedData = rightCodes.slice((rightPage - 1) * rightPerPage, rightPage * rightPerPage);
  const rightStart = rightCodes.length > 0 ? (rightPage - 1) * rightPerPage + 1 : 0;
  const rightEnd = Math.min(rightPage * rightPerPage, rightCodes.length);

  const handleSearch = () => {
    setLeftPage(1);
  };

  const handleGroupClick = (codeType: string) => {
    setSelectedGroup(codeType);
    setRightPage(1);
    setRightChecked(new Set());
  };

  const handleCreateLeft = () => {
    setEditingCode(undefined);
    setIsFormOpen(true);
  };

  const handleCreateRight = () => {
    setEditingCode(undefined);
    setIsRightFormOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCode) return;
    try {
      await deleteMutation.mutateAsync(deletingCode.id);
      addToast({ type: "success", message: `"${deletingCode.codeNm}" 코드가 삭제되었습니다.` });
    } catch {
      addToast({ type: "error", message: "삭제 중 오류가 발생했습니다." });
    } finally {
      setDeletingCode(undefined);
    }
  };

  const toggleLeftCheck = (codeType: string) => {
    setLeftChecked((prev) => {
      const next = new Set(prev);
      if (next.has(codeType)) next.delete(codeType);
      else next.add(codeType);
      return next;
    });
  };

  const toggleLeftAll = () => {
    if (leftChecked.size === leftPagedData.length) {
      setLeftChecked(new Set());
    } else {
      setLeftChecked(new Set(leftPagedData.map((r) => r.codeType)));
    }
  };

  const toggleRightCheck = (id: string) => {
    setRightChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleRightAll = () => {
    if (rightChecked.size === rightPagedData.length) {
      setRightChecked(new Set());
    } else {
      setRightChecked(new Set(rightPagedData.map((r) => r.id)));
    }
  };

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#191F28]">기준관리</h1>
        <p className="text-sm text-[#8B95A1]">시스템관리 &gt; 기준코드</p>
      </div>

      {/* Search area */}
      <div className="rounded-lg bg-white p-4 shadow-sm border border-[#E5E8EB]">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-[#6B7684]">유형코드</label>
            <input
              type="text"
              value={searchGroupCode}
              onChange={(e) => setSearchGroupCode(e.target.value)}
              className={inputBase}
              placeholder="유형코드"
            />
          </div>
          <div className="min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-[#6B7684]">유형명</label>
            <input
              type="text"
              value={searchGroupName}
              onChange={(e) => setSearchGroupName(e.target.value)}
              className={inputBase}
              placeholder="유형명"
            />
          </div>
          <div className="min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-[#6B7684]">사용자구분</label>
            <select
              value={searchUserType}
              onChange={(e) => setSearchUserType(e.target.value)}
              className={selectBase + " w-full"}
            >
              <option value="">전체</option>
              <option value="마스터">마스터</option>
              <option value="고객사">고객사</option>
            </select>
          </div>
          <button
            onClick={handleSearch}
            className="flex items-center gap-1.5 rounded bg-[#3182F6] px-4 py-2 text-sm font-medium text-white hover:bg-[#1B64DA]"
          >
            <Search className="h-4 w-4" />
            검색
          </button>
        </div>
      </div>

      {/* Top action buttons (for left panel) */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => addToast({ type: "info", message: "저장되었습니다." })}
          className="rounded px-4 py-1.5 text-xs font-semibold text-white bg-[#F04452] hover:bg-[#E03340]"
        >
          저장
        </button>
        <button
          onClick={handleCreateLeft}
          className="rounded px-4 py-1.5 text-xs font-semibold text-white bg-[#3182F6] hover:bg-[#1B64DA]"
        >
          신규
        </button>
        <button
          onClick={() => addToast({ type: "warning", message: "삭제할 항목을 선택해주세요." })}
          className="rounded px-4 py-1.5 text-xs font-semibold text-white bg-[#6B7684] hover:bg-[#4E5968]"
        >
          삭제
        </button>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left panel: 코드유형 목록 */}
        <div className="rounded-lg bg-white border border-[#E5E8EB] overflow-hidden">
          {/* Left grid header */}
          <div className="bg-[#4A5568] px-4 py-2.5">
            <h2 className="text-sm font-semibold text-white">코드유형 목록</h2>
          </div>

          {error ? (
            <div className="flex items-center gap-3 p-5 text-sm text-red-600">
              <AlertCircle className="h-5 w-5 shrink-0" />
              데이터를 불러오는 중 오류가 발생했습니다.
            </div>
          ) : (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#F7F8FA] border-b border-[#E5E8EB]">
                    <tr>
                      <th className="px-3 py-2.5 text-xs font-medium text-[#8B95A1] w-[50px] text-center">No</th>
                      <th className="px-3 py-2.5 text-xs font-medium text-[#8B95A1] w-[40px] text-center">
                        <input
                          type="checkbox"
                          checked={leftPagedData.length > 0 && leftChecked.size === leftPagedData.length}
                          onChange={toggleLeftAll}
                          className="h-3.5 w-3.5 rounded border-gray-300"
                        />
                      </th>
                      <th className="px-3 py-2.5 text-xs font-medium text-[#8B95A1]">*사용자구분</th>
                      <th className="px-3 py-2.5 text-xs font-medium text-[#8B95A1]">*유형코드</th>
                      <th className="px-3 py-2.5 text-xs font-medium text-[#8B95A1]">*유형명</th>
                      <th className="px-3 py-2.5 text-xs font-medium text-[#8B95A1]">*코드레벨</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b border-[#F2F4F6]">
                          {Array.from({ length: 6 }).map((_, j) => (
                            <td key={j} className="px-3 py-3">
                              <div className="h-4 w-full animate-pulse rounded bg-[#F2F4F6]" />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : leftPagedData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-12 text-center text-sm text-[#B0B8C1]">
                          코드유형이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      leftPagedData.map((row, idx) => (
                        <tr
                          key={row.codeType}
                          className={`border-b border-[#F2F4F6] cursor-pointer transition-colors hover:bg-[#F7F8FA] ${
                            selectedGroup === row.codeType ? "bg-[#EBF5FF] hover:bg-[#EBF5FF]" : ""
                          }`}
                          onClick={() => handleGroupClick(row.codeType)}
                        >
                          <td className="px-3 py-2.5 text-center text-sm text-[#4E5968]">
                            {(leftPage - 1) * leftPerPage + idx + 1}
                          </td>
                          <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={leftChecked.has(row.codeType)}
                              onChange={() => toggleLeftCheck(row.codeType)}
                              className="h-3.5 w-3.5 rounded border-gray-300"
                            />
                          </td>
                          <td className="px-3 py-2.5 text-sm text-[#4E5968]">{row.userType}</td>
                          <td className="px-3 py-2.5 text-sm text-[#191F28] font-medium">{row.codeType}</td>
                          <td className="px-3 py-2.5 text-sm text-[#4E5968]">{row.typeNm}</td>
                          <td className="px-3 py-2.5 text-sm text-[#4E5968]">{row.codeLevel}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E8EB]">
                <p className="text-xs text-[#8B95A1]">
                  View {leftStart}-{leftEnd} of {groupRows.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={leftPage <= 1}
                    onClick={() => setLeftPage(leftPage - 1)}
                    className="p-1 rounded border border-[#E5E8EB] text-[#8B95A1] hover:bg-[#F7F8FA] disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs text-[#4E5968]">
                    Page {leftPage} of {leftTotalPages}
                  </span>
                  <button
                    disabled={leftPage >= leftTotalPages}
                    onClick={() => setLeftPage(leftPage + 1)}
                    className="p-1 rounded border border-[#E5E8EB] text-[#8B95A1] hover:bg-[#F7F8FA] disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right panel: 기초코드 목록 */}
        <div className="rounded-lg bg-white border border-[#E5E8EB] overflow-hidden">
          {/* Right action buttons */}
          <div className="flex items-center justify-end gap-2 px-4 py-2.5">
            <button
              onClick={() => addToast({ type: "info", message: "저장되었습니다." })}
              className="rounded px-4 py-1.5 text-xs font-semibold text-white bg-[#F04452] hover:bg-[#E03340]"
            >
              저장
            </button>
            <button
              onClick={handleCreateRight}
              className="rounded px-4 py-1.5 text-xs font-semibold text-white bg-[#3182F6] hover:bg-[#1B64DA]"
            >
              신규
            </button>
            <button
              onClick={() => {
                if (rightChecked.size > 0) {
                  const code = rightPagedData.find((c) => rightChecked.has(c.id));
                  if (code) setDeletingCode(code);
                } else {
                  addToast({ type: "warning", message: "삭제할 항목을 선택해주세요." });
                }
              }}
              className="rounded px-4 py-1.5 text-xs font-semibold text-white bg-[#6B7684] hover:bg-[#4E5968]"
            >
              삭제
            </button>
            <button
              onClick={() => addToast({ type: "info", message: "엑셀 다운로드" })}
              className="rounded px-4 py-1.5 text-xs font-semibold text-white bg-[#22C55E] hover:bg-[#16A34A]"
            >
              엑셀
            </button>
          </div>

          {/* Right grid header */}
          <div className="bg-[#4A5568] px-4 py-2.5">
            <h2 className="text-sm font-semibold text-white">기초코드 목록</h2>
          </div>

          {!selectedGroup ? (
            <div className="py-16 text-center text-sm text-[#8B95A1]">
              좌측에서 코드유형을 선택해주세요.
            </div>
          ) : (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#F7F8FA] border-b border-[#E5E8EB]">
                    <tr>
                      <th className="px-3 py-2.5 text-xs font-medium text-[#8B95A1] w-[50px] text-center">No</th>
                      <th className="px-3 py-2.5 text-xs font-medium text-[#8B95A1] w-[40px] text-center">
                        <input
                          type="checkbox"
                          checked={rightPagedData.length > 0 && rightChecked.size === rightPagedData.length}
                          onChange={toggleRightAll}
                          className="h-3.5 w-3.5 rounded border-gray-300"
                        />
                      </th>
                      <th className="px-3 py-2.5 text-xs font-medium text-[#8B95A1]">기초코드</th>
                      <th className="px-3 py-2.5 text-xs font-medium text-[#8B95A1]">*기초코드명</th>
                      <th className="px-3 py-2.5 text-xs font-medium text-[#8B95A1]">값</th>
                      <th className="px-3 py-2.5 text-xs font-medium text-[#8B95A1]">순서</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b border-[#F2F4F6]">
                          {Array.from({ length: 6 }).map((_, j) => (
                            <td key={j} className="px-3 py-3">
                              <div className="h-4 w-full animate-pulse rounded bg-[#F2F4F6]" />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : rightPagedData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-12 text-center text-sm text-[#B0B8C1]">
                          기초코드가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      rightPagedData.map((row, idx) => (
                        <tr
                          key={row.id}
                          className="border-b border-[#F2F4F6] transition-colors hover:bg-[#F7F8FA] cursor-pointer"
                          onClick={() => {
                            setEditingCode(row);
                            setIsRightFormOpen(true);
                          }}
                        >
                          <td className="px-3 py-2.5 text-center text-sm text-[#4E5968]">
                            {(rightPage - 1) * rightPerPage + idx + 1}
                          </td>
                          <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={rightChecked.has(row.id)}
                              onChange={() => toggleRightCheck(row.id)}
                              className="h-3.5 w-3.5 rounded border-gray-300"
                            />
                          </td>
                          <td className="px-3 py-2.5 text-sm text-[#191F28] font-medium">{row.code}</td>
                          <td className="px-3 py-2.5 text-sm text-[#4E5968]">{row.codeNm}</td>
                          <td className="px-3 py-2.5 text-sm text-[#4E5968]">{row.value ?? "-"}</td>
                          <td className="px-3 py-2.5 text-sm text-[#4E5968]">{row.sortOrder}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E8EB]">
                <p className="text-xs text-[#8B95A1]">
                  View {rightStart}-{rightEnd} of {rightCodes.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={rightPage <= 1}
                    onClick={() => setRightPage(rightPage - 1)}
                    className="p-1 rounded border border-[#E5E8EB] text-[#8B95A1] hover:bg-[#F7F8FA] disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs text-[#4E5968]">
                    Page {rightPage} of {rightTotalPages}
                  </span>
                  <button
                    disabled={rightPage >= rightTotalPages}
                    onClick={() => setRightPage(rightPage + 1)}
                    className="p-1 rounded border border-[#E5E8EB] text-[#8B95A1] hover:bg-[#F7F8FA] disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit form for left (code type) */}
      <CommonCodeFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        code={editingCode}
        defaultGroupCode=""
      />

      {/* Create/Edit form for right (basic code) */}
      <CommonCodeFormModal
        isOpen={isRightFormOpen}
        onClose={() => setIsRightFormOpen(false)}
        code={editingCode}
        defaultGroupCode={selectedGroup}
      />

      <ConfirmModal
        isOpen={!!deletingCode}
        onClose={() => setDeletingCode(undefined)}
        onConfirm={handleDeleteConfirm}
        title="코드 삭제"
        message={`"${deletingCode?.codeNm}" 코드를 삭제하시겠습니까?`}
        confirmText="삭제"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

// --- Form Modal ---
function CommonCodeFormModal({
  isOpen,
  onClose,
  code,
  defaultGroupCode,
}: {
  isOpen: boolean;
  onClose: () => void;
  code?: CommonCode;
  defaultGroupCode?: string;
}) {
  const isEdit = !!code;
  const addToast = useToastStore((s) => s.addToast);
  const createMutation = useCreateCommonCode();
  const updateMutation = useUpdateCommonCode();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CodeFormData>({
    resolver: zodResolver(codeSchema),
    defaultValues: {
      codeType: "",
      typeNm: "",
      code: "",
      codeNm: "",
      value: "",
      sortOrder: 0,
      isActive: true,
    },
  });

  const isActive = watch("isActive");

  useEffect(() => {
    if (isOpen) {
      if (code) {
        reset({
          codeType: code.codeType,
          typeNm: code.typeNm ?? "",
          code: code.code,
          codeNm: code.codeNm,
          value: code.value ?? "",
          sortOrder: code.sortOrder,
          isActive: code.isActive,
        });
      } else {
        reset({
          codeType: defaultGroupCode ?? "",
          typeNm: "",
          code: "",
          codeNm: "",
          value: "",
          sortOrder: 0,
          isActive: true,
        });
      }
    }
  }, [isOpen, code, defaultGroupCode, reset]);

  const onSubmit = async (data: CodeFormData) => {
    try {
      if (isEdit && code) {
        await updateMutation.mutateAsync({ id: code.id, payload: data });
        addToast({ type: "success", message: "코드가 수정되었습니다." });
      } else {
        await createMutation.mutateAsync(data);
        addToast({ type: "success", message: "코드가 등록되었습니다." });
      }
      onClose();
    } catch {
      addToast({ type: "error", message: "오류가 발생했습니다." });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "코드 수정" : "코드 등록"} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              코드유형 <span className="text-red-500">*</span>
            </label>
            <input {...register("codeType")} placeholder="GROUP_CODE" className={inputBase} />
            {errors.codeType && (
              <p className="mt-1.5 text-xs text-red-500">{errors.codeType.message}</p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">유형명</label>
            <input {...register("typeNm")} placeholder="유형명" className={inputBase} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              코드 <span className="text-red-500">*</span>
            </label>
            <input {...register("code")} placeholder="코드" className={inputBase} disabled={isEdit} />
            {errors.code && (
              <p className="mt-1.5 text-xs text-red-500">{errors.code.message}</p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              코드명 <span className="text-red-500">*</span>
            </label>
            <input {...register("codeNm")} placeholder="코드명" className={inputBase} />
            {errors.codeNm && (
              <p className="mt-1.5 text-xs text-red-500">{errors.codeNm.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">값</label>
            <input {...register("value")} placeholder="값" className={inputBase} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">순서</label>
            <input {...register("sortOrder")} type="number" placeholder="0" className={inputBase} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setValue("isActive", !isActive)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
              isActive ? "bg-[#3182F6]" : "bg-[#D1D6DB]"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                isActive ? "translate-x-[22px]" : "translate-x-0.5"
              } mt-0.5`}
            />
          </button>
          <span className="text-sm font-medium text-[#4E5968]">
            {isActive ? "사용" : "미사용"}
          </span>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#F2F4F6] px-6 py-2.5 text-sm font-semibold text-[#4E5968] transition-colors hover:bg-[#E5E8EB]"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-[#3182F6] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1B64DA] disabled:opacity-50"
          >
            {isSubmitting ? "처리중..." : isEdit ? "수정" : "등록"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
