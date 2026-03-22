"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, AlertCircle } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  useContainerGroups,
  useCreateContainerGroup,
  useUpdateContainerGroup,
  useDeleteContainerGroup,
} from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import { useDebounce } from "@/hooks/useDebounce";
import { downloadExcel } from "@/lib/export";
import { formatDate } from "@/lib/utils";
import type { ContainerGroup } from "@/types";

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";

const cgSchema = z.object({
  groupCode: z.string().min(1, "용기군코드를 입력해주세요"),
  groupName: z.string().min(1, "용기군명을 입력해주세요"),
  centerId: z.string().optional(),
  zoneId: z.string().optional(),
});

type CgFormData = z.infer<typeof cgSchema>;

export default function ContainerGroupsPage() {
  const [searchId, setSearchId] = useState("");
  const [searchName, setSearchName] = useState("");
  const debouncedSearchId = useDebounce(searchId);
  const debouncedSearchName = useDebounce(searchName);
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ContainerGroup | undefined>();
  const [deletingGroup, setDeletingGroup] = useState<ContainerGroup | undefined>();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const addToast = useToastStore((s) => s.addToast);

  const { data: response, isLoading, error } = useContainerGroups({
    page,
    limit: 20,
    ...(debouncedSearchId ? { search: debouncedSearchId } : {}),
    ...(debouncedSearchName ? { name: debouncedSearchName } : {}),
  });

  const deleteMutation = useDeleteContainerGroup();

  const groups = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  const handleCreate = () => {
    setEditingGroup(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (g: ContainerGroup) => {
    setEditingGroup(g);
    setIsFormOpen(true);
  };

  const handleDeleteClick = () => {
    if (selectedRows.size === 0) {
      addToast({ type: "error", message: "삭제할 항목을 선택해주세요." });
      return;
    }
    const firstId = Array.from(selectedRows)[0];
    const group = groups.find((g) => g.id === firstId);
    if (group) setDeletingGroup(group);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingGroup) return;
    try {
      // Delete all selected rows
      for (const id of selectedRows) {
        await deleteMutation.mutateAsync(id);
      }
      addToast({ type: "success", message: `${selectedRows.size}건의 용기군이 삭제되었습니다.` });
      setSelectedRows(new Set());
    } catch {
      addToast({ type: "error", message: "삭제 중 오류가 발생했습니다." });
    } finally {
      setDeletingGroup(undefined);
    }
  };

  const toggleRow = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedRows.size === groups.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(groups.map((g) => g.id)));
    }
  };

  const columns: Column<ContainerGroup>[] = [
    {
      key: "select",
      header: "",
      width: "w-[50px]",
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedRows.has(row.id)}
          onChange={() => toggleRow(row.id)}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded border-[#D1D6DB] text-[#3182F6]"
        />
      ),
    },
    { key: "groupCode", header: "용기군코드", sortable: true },
    { key: "groupName", header: "용기군명", sortable: true },
    {
      key: "centerId",
      header: "물류센터ID",
      render: (row) => <span className="text-sm text-[#4E5968]">{row.centerId ?? "-"}</span>,
    },
    {
      key: "zoneId",
      header: "존ID",
      render: (row) => <span className="text-sm text-[#4E5968]">{row.zoneId ?? "-"}</span>,
    },
    {
      key: "workerIp",
      header: "작업자IP",
      render: (row) => <span className="text-sm text-[#4E5968]">{(row as any).workerIp ?? "-"}</span>,
    },
    {
      key: "createdAt",
      header: "등록일자",
      render: (row) => <span className="text-sm text-[#4E5968]">{formatDate(row.createdAt)}</span>,
    },
    {
      key: "createdBy",
      header: "등록자번호",
      render: (row) => <span className="text-sm text-[#4E5968]">{(row as any).createdBy ?? "-"}</span>,
    },
    {
      key: "updatedAt",
      header: "수정일자",
      render: (row) => <span className="text-sm text-[#4E5968]">{formatDate(row.updatedAt)}</span>,
    },
    {
      key: "updatedBy",
      header: "수정자번호",
      render: (row) => <span className="text-sm text-[#4E5968]">{(row as any).updatedBy ?? "-"}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#8B95A1]">기준관리 &gt; 물류용기군관리</p>
          <h1 className="text-2xl font-bold text-[#191F28]">물류용기군관리</h1>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">물류용기군 ID</label>
            <input
              type="text"
              placeholder="물류용기군 ID"
              value={searchId}
              onChange={(e) => { setSearchId(e.target.value); setPage(1); }}
              className={inputBase}
            />
          </div>
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-sm font-medium text-[#4E5968]">물류용기명</label>
            <input
              type="text"
              placeholder="물류용기명"
              value={searchName}
              onChange={(e) => { setSearchName(e.target.value); setPage(1); }}
              className={inputBase}
            />
          </div>
          <button
            onClick={() => setPage(1)}
            className="flex h-[46px] items-center gap-2 rounded-xl bg-[#3182F6] px-6 text-sm font-semibold text-white hover:bg-[#1B64DA]"
          >
            <Search className="h-4 w-4" />
            조회
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button onClick={handleCreate} className="rounded-xl bg-[#3182F6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1B64DA]">등록</button>
        <button onClick={() => {
          if (selectedRows.size !== 1) {
            addToast({ type: "error", message: "수정할 항목을 1건 선택해주세요." });
            return;
          }
          const id = Array.from(selectedRows)[0];
          const group = groups.find((g) => g.id === id);
          if (group) handleEdit(group);
        }} className="rounded-xl bg-[#F04452] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#D63341]">수정</button>
        <button onClick={handleDeleteClick} className="rounded-xl bg-[#8B95A1] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6B7684]">삭제</button>
        <button onClick={() => downloadExcel("/export/container-groups", "container_groups.xlsx")} className="rounded-xl bg-[#1FC47D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#17A86B]">엑셀</button>
      </div>

      {/* Grid */}
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="mb-4 flex items-center justify-between rounded-lg bg-[#4A5568] px-4 py-2">
          <h2 className="text-sm font-bold text-white">용기군목록</h2>
          <span className="text-xs text-gray-300">총 {total}건</span>
        </div>
        {error ? (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        ) : (
          <>
            {/* Custom header with select-all checkbox */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F7F8FA]">
                  <tr>
                    <th className="w-[50px] px-5 py-4 text-xs font-medium uppercase tracking-wider text-[#8B95A1]">
                      <input
                        type="checkbox"
                        checked={groups.length > 0 && selectedRows.size === groups.length}
                        onChange={toggleAll}
                        className="h-4 w-4 rounded border-[#D1D6DB] text-[#3182F6]"
                      />
                    </th>
                    <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-[#8B95A1]">용기군코드</th>
                    <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-[#8B95A1]">용기군명</th>
                    <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-[#8B95A1]">물류센터ID</th>
                    <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-[#8B95A1]">존ID</th>
                    <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-[#8B95A1]">작업자IP</th>
                    <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-[#8B95A1]">등록일자</th>
                    <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-[#8B95A1]">등록자번호</th>
                    <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-[#8B95A1]">수정일자</th>
                    <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-[#8B95A1]">수정자번호</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-[#F2F4F6]">
                        {Array.from({ length: 10 }).map((_, j) => (
                          <td key={j} className="px-5 py-4">
                            <div className="h-4 w-full animate-pulse rounded-lg bg-[#F2F4F6]" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : groups.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-5 py-16 text-center text-[#B0B8C1]">
                        물류용기군 데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    groups.map((row) => (
                      <tr
                        key={row.id}
                        className="cursor-pointer border-b border-[#F2F4F6] transition-colors duration-200 hover:bg-[#F7F8FA]"
                        onClick={() => handleEdit(row)}
                      >
                        <td className="px-5 py-4">
                          <input
                            type="checkbox"
                            checked={selectedRows.has(row.id)}
                            onChange={() => toggleRow(row.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 rounded border-[#D1D6DB] text-[#3182F6]"
                          />
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-[#191F28]">{row.groupCode}</td>
                        <td className="px-5 py-4 text-sm text-[#4E5968]">{row.groupName}</td>
                        <td className="px-5 py-4 text-sm text-[#4E5968]">{row.centerId ?? "-"}</td>
                        <td className="px-5 py-4 text-sm text-[#4E5968]">{row.zoneId ?? "-"}</td>
                        <td className="px-5 py-4 text-sm text-[#4E5968]">{(row as any).workerIp ?? "-"}</td>
                        <td className="px-5 py-4 text-sm text-[#4E5968]">{formatDate(row.createdAt)}</td>
                        <td className="px-5 py-4 text-sm text-[#4E5968]">{(row as any).createdBy ?? "-"}</td>
                        <td className="px-5 py-4 text-sm text-[#4E5968]">{formatDate(row.updatedAt)}</td>
                        <td className="px-5 py-4 text-sm text-[#4E5968]">{(row as any).updatedBy ?? "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-5 flex items-center justify-between">
                <p className="text-sm text-[#8B95A1]">
                  총 <span className="font-semibold text-[#191F28]">{total}</span>건
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="rounded-lg border border-[#E5E8EB] px-3 py-1.5 text-sm text-[#4E5968] hover:bg-[#F7F8FA] disabled:opacity-40"
                  >
                    이전
                  </button>
                  <span className="rounded-xl bg-[#F7F8FA] px-4 py-1.5 text-sm font-medium text-[#4E5968]">
                    {page} / {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    className="rounded-lg border border-[#E5E8EB] px-3 py-1.5 text-sm text-[#4E5968] hover:bg-[#F7F8FA] disabled:opacity-40"
                  >
                    다음
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <CgFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} group={editingGroup} />

      <ConfirmModal
        isOpen={!!deletingGroup}
        onClose={() => setDeletingGroup(undefined)}
        onConfirm={handleDeleteConfirm}
        title="용기군 삭제"
        message={`선택한 ${selectedRows.size}건의 용기군을 삭제하시겠습니까?`}
        confirmText="삭제"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

function CgFormModal({ isOpen, onClose, group }: { isOpen: boolean; onClose: () => void; group?: ContainerGroup }) {
  const isEdit = !!group;
  const addToast = useToastStore((s) => s.addToast);
  const createMutation = useCreateContainerGroup();
  const updateMutation = useUpdateContainerGroup();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CgFormData>({
    resolver: zodResolver(cgSchema),
    defaultValues: { groupCode: "", groupName: "", centerId: "", zoneId: "" },
  });

  useEffect(() => {
    if (isOpen) {
      if (group) {
        reset({ groupCode: group.groupCode, groupName: group.groupName, centerId: group.centerId ?? "", zoneId: group.zoneId ?? "" });
      } else {
        reset({ groupCode: "", groupName: "", centerId: "", zoneId: "" });
      }
    }
  }, [isOpen, group, reset]);

  const onSubmit = async (data: CgFormData) => {
    try {
      if (isEdit && group) {
        await updateMutation.mutateAsync({ id: group.id, payload: data });
        addToast({ type: "success", message: "용기군이 수정되었습니다." });
      } else {
        await createMutation.mutateAsync(data);
        addToast({ type: "success", message: "용기군이 등록되었습니다." });
      }
      onClose();
    } catch {
      addToast({ type: "error", message: "오류가 발생했습니다." });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "용기군 수정" : "용기군 등록"} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">용기군코드 <span className="text-red-500">*</span></label>
            <input {...register("groupCode")} placeholder="GRP-001" className={inputBase} disabled={isEdit} />
            {errors.groupCode && <p className="mt-1.5 text-xs text-red-500">{errors.groupCode.message}</p>}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">용기군명 <span className="text-red-500">*</span></label>
            <input {...register("groupName")} placeholder="용기군명" className={inputBase} />
            {errors.groupName && <p className="mt-1.5 text-xs text-red-500">{errors.groupName.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">물류센터ID</label>
            <input {...register("centerId")} placeholder="물류센터ID" className={inputBase} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">존ID</label>
            <input {...register("zoneId")} placeholder="존ID" className={inputBase} />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-xl bg-[#F2F4F6] px-6 py-2.5 text-sm font-semibold text-[#4E5968] hover:bg-[#E5E8EB]">취소</button>
          <button type="submit" disabled={isSubmitting} className="rounded-xl bg-[#3182F6] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1B64DA] disabled:opacity-50">
            {isSubmitting ? "처리중..." : isEdit ? "수정" : "등록"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
