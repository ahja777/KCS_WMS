"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Trash2, AlertCircle } from "lucide-react";
import Table, { type Column } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  useVehicles,
  useCreateVehicle,
  useUpdateVehicle,
  useDeleteVehicle,
} from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import { useDebounce } from "@/hooks/useDebounce";
import { formatNumber } from "@/lib/utils";
import type { Vehicle } from "@/types";

const vehicleSchema = z.object({
  plateNumber: z.string().min(1, "차량번호를 입력해주세요"),
  tonnage: z.coerce.number().min(0, "0 이상 입력해주세요"),
  type: z.string().min(1, "유형을 선택해주세요"),
  driverName: z.string().min(1, "기사명을 입력해주세요"),
  driverPhone: z.string().optional(),
  isActive: z.boolean(),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

const inputBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] placeholder-[#B0B8C1] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20";
const selectBase =
  "w-full rounded-xl border-0 bg-[#F7F8FA] px-4 py-3 text-sm text-[#191F28] outline-none transition-all focus:border focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/20 appearance-none";

const vehicleTypeOptions = [
  { value: "WING_BODY", label: "윙바디" },
  { value: "TOP_OPEN", label: "탑차" },
  { value: "CARGO", label: "카고" },
  { value: "FLAT", label: "평판" },
  { value: "REFRIGERATED", label: "냉동/냉장" },
  { value: "TANK", label: "탱크로리" },
  { value: "OTHER", label: "기타" },
];

export default function VehiclesPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | undefined>();
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | undefined>();

  const addToast = useToastStore((s) => s.addToast);

  const { data: response, isLoading, error } = useVehicles({
    page,
    limit: 20,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const deleteMutation = useDeleteVehicle();

  const vehicles = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  const handleCreate = () => {
    setEditingVehicle(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, v: Vehicle) => {
    e.stopPropagation();
    setDeletingVehicle(v);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingVehicle) return;
    try {
      await deleteMutation.mutateAsync(deletingVehicle.id);
      addToast({ type: "success", message: `"${deletingVehicle.plateNumber}" 차량이 삭제되었습니다.` });
    } catch {
      addToast({ type: "error", message: "삭제 중 오류가 발생했습니다." });
    } finally {
      setDeletingVehicle(undefined);
    }
  };

  const getTypeLabel = (type: string) => {
    return vehicleTypeOptions.find((o) => o.value === type)?.label ?? type;
  };

  const columns: Column<Vehicle>[] = [
    { key: "plateNumber", header: "차량번호", sortable: true },
    {
      key: "tonnage",
      header: "톤수",
      sortable: true,
      render: (row) => `${formatNumber(row.tonnage)}톤`,
    },
    {
      key: "type",
      header: "유형",
      render: (row) => (
        <span className="inline-flex rounded-lg bg-[#F2F4F6] px-2.5 py-1 text-xs font-medium text-[#4E5968]">
          {getTypeLabel(row.type)}
        </span>
      ),
    },
    { key: "driverName", header: "기사명", sortable: true },
    { key: "driverPhone", header: "연락처" },
    {
      key: "isActive",
      header: "상태",
      render: (row) => <Badge status={row.isActive ? "ACTIVE" : "INACTIVE"} />,
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <button
          onClick={(e) => handleDeleteClick(e, row)}
          className="rounded-lg p-1.5 text-[#B0B8C1] transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#191F28]">차량 관리</h1>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-xl bg-[#3182F6] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1B64DA]"
        >
          <Plus className="h-4 w-4" />
          차량 등록
        </button>
      </div>

      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B95A1]" />
            <input
              type="text"
              placeholder="차량번호, 기사명 검색..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border-0 bg-[#F7F8FA] py-3 pl-11 pr-4 text-sm text-[#191F28] placeholder-[#8B95A1] outline-none transition-colors focus:bg-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]/20"
            />
          </div>
        </div>

        {error ? (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        ) : (
          <Table
            columns={columns}
            data={vehicles}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
            onRowClick={handleEdit}
          />
        )}
      </div>

      <VehicleFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        vehicle={editingVehicle}
      />

      <ConfirmModal
        isOpen={!!deletingVehicle}
        onClose={() => setDeletingVehicle(undefined)}
        onConfirm={handleDeleteConfirm}
        title="차량 삭제"
        message={`"${deletingVehicle?.plateNumber}" 차량을 삭제하시겠습니까?`}
        confirmText="삭제"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

// --- Form Modal ---
function VehicleFormModal({
  isOpen,
  onClose,
  vehicle,
}: {
  isOpen: boolean;
  onClose: () => void;
  vehicle?: Vehicle;
}) {
  const isEdit = !!vehicle;
  const addToast = useToastStore((s) => s.addToast);
  const createMutation = useCreateVehicle();
  const updateMutation = useUpdateVehicle();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      plateNumber: "",
      tonnage: 0,
      type: "WING_BODY",
      driverName: "",
      driverPhone: "",
      isActive: true,
    },
  });

  const isActive = watch("isActive");

  useEffect(() => {
    if (isOpen) {
      if (vehicle) {
        reset({
          plateNumber: vehicle.plateNumber,
          tonnage: vehicle.tonnage,
          type: vehicle.type,
          driverName: vehicle.driverName,
          driverPhone: vehicle.driverPhone ?? "",
          isActive: vehicle.isActive,
        });
      } else {
        reset({
          plateNumber: "",
          tonnage: 0,
          type: "WING_BODY",
          driverName: "",
          driverPhone: "",
          isActive: true,
        });
      }
    }
  }, [isOpen, vehicle, reset]);

  const onSubmit = async (data: VehicleFormData) => {
    try {
      if (isEdit && vehicle) {
        await updateMutation.mutateAsync({ id: vehicle.id, payload: data });
        addToast({ type: "success", message: "차량이 수정되었습니다." });
      } else {
        await createMutation.mutateAsync(data);
        addToast({ type: "success", message: "차량이 등록되었습니다." });
      }
      onClose();
    } catch {
      addToast({ type: "error", message: "오류가 발생했습니다." });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "차량 수정" : "차량 등록"} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              차량번호 <span className="text-red-500">*</span>
            </label>
            <input
              {...register("plateNumber")}
              placeholder="12가 3456"
              className={inputBase}
              disabled={isEdit}
            />
            {errors.plateNumber && (
              <p className="mt-1.5 text-xs text-red-500">{errors.plateNumber.message}</p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              톤수 <span className="text-red-500">*</span>
            </label>
            <input
              {...register("tonnage")}
              type="number"
              step="0.5"
              placeholder="0"
              className={inputBase}
            />
            {errors.tonnage && (
              <p className="mt-1.5 text-xs text-red-500">{errors.tonnage.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-[#4E5968]">
            유형 <span className="text-red-500">*</span>
          </label>
          <select {...register("type")} className={selectBase}>
            {vehicleTypeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">
              기사명 <span className="text-red-500">*</span>
            </label>
            <input {...register("driverName")} placeholder="기사명" className={inputBase} />
            {errors.driverName && (
              <p className="mt-1.5 text-xs text-red-500">{errors.driverName.message}</p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#4E5968]">연락처</label>
            <input
              {...register("driverPhone")}
              placeholder="010-0000-0000"
              className={inputBase}
            />
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
            {isActive ? "운행중" : "운행중지"}
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
