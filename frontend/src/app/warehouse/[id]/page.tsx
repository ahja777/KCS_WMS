"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Building2,
  AlertCircle,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  useWarehouse,
  useZones,
  useDeleteZone,
  useLocations,
  useDeleteLocation,
} from "@/hooks/useApi";
import { useToastStore } from "@/stores/toast.store";
import { formatDateTime } from "@/lib/utils";
import type { Zone, Location } from "@/types";
import ZoneFormModal from "@/components/warehouse/ZoneFormModal";
import LocationFormModal from "@/components/warehouse/LocationFormModal";

export default function WarehouseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const warehouseId = params.id as string;

  const addToast = useToastStore((s) => s.addToast);

  // Warehouse detail
  const { data: warehouse, isLoading: whLoading, error: whError } = useWarehouse(warehouseId);

  // Zones
  const { data: zonesResponse, isLoading: zonesLoading, error: zonesError } = useZones(warehouseId);
  const zones = zonesResponse?.data ?? [];
  const deleteZoneMutation = useDeleteZone(warehouseId);

  // Zone form
  const [isZoneFormOpen, setIsZoneFormOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | undefined>();
  const [deletingZone, setDeletingZone] = useState<Zone | undefined>();

  // Expanded zone for locations
  const [expandedZoneId, setExpandedZoneId] = useState<string | null>(null);

  // Location form
  const [isLocationFormOpen, setIsLocationFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | undefined>();
  const [deletingLocation, setDeletingLocation] = useState<{ location: Location; zoneId: string } | undefined>();
  const [locationZoneId, setLocationZoneId] = useState<string>("");

  // Zone handlers
  const handleCreateZone = () => {
    setEditingZone(undefined);
    setIsZoneFormOpen(true);
  };

  const handleEditZone = (e: React.MouseEvent, zone: Zone) => {
    e.stopPropagation();
    setEditingZone(zone);
    setIsZoneFormOpen(true);
  };

  const handleDeleteZoneClick = (e: React.MouseEvent, zone: Zone) => {
    e.stopPropagation();
    setDeletingZone(zone);
  };

  const handleDeleteZoneConfirm = async () => {
    if (!deletingZone) return;
    try {
      await deleteZoneMutation.mutateAsync(deletingZone.id);
      addToast({ type: "success", message: `"${deletingZone.name}" 구역이 삭제되었습니다.` });
      if (expandedZoneId === deletingZone.id) setExpandedZoneId(null);
    } catch {
      addToast({ type: "error", message: "삭제 중 오류가 발생했습니다." });
    } finally {
      setDeletingZone(undefined);
    }
  };

  const toggleZoneExpand = (zoneId: string) => {
    setExpandedZoneId((prev) => (prev === zoneId ? null : zoneId));
  };

  // Location handlers
  const handleCreateLocation = (e: React.MouseEvent, zoneId: string) => {
    e.stopPropagation();
    setEditingLocation(undefined);
    setLocationZoneId(zoneId);
    setIsLocationFormOpen(true);
  };

  const handleEditLocation = (location: Location, zoneId: string) => {
    setEditingLocation(location);
    setLocationZoneId(zoneId);
    setIsLocationFormOpen(true);
  };

  const handleDeleteLocationClick = (e: React.MouseEvent, location: Location, zoneId: string) => {
    e.stopPropagation();
    setDeletingLocation({ location, zoneId });
  };

  if (whLoading) {
    return (
      <div className="space-y-8">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-[#F2F4F6]" />
        <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-5 w-full animate-pulse rounded-lg bg-[#F2F4F6]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (whError || !warehouse) {
    return (
      <div className="space-y-8">
        <button
          onClick={() => router.push("/warehouse")}
          className="flex items-center gap-2 text-sm text-[#6B7684] transition-colors hover:text-[#191F28]"
        >
          <ArrowLeft className="h-4 w-4" />
          창고 목록으로
        </button>
        <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
          <AlertCircle className="h-5 w-5 shrink-0" />
          창고 정보를 불러올 수 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header: Back button + Warehouse name + status badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/warehouse")}
            className="flex items-center justify-center rounded-xl p-2 text-[#6B7684] transition-colors hover:bg-[#F7F8FA] hover:text-[#191F28]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#191F28]">{warehouse.name}</h1>
            <p className="mt-1 text-sm text-[#8B95A1]">{warehouse.code}</p>
          </div>
          <Badge status={warehouse.status} />
        </div>
      </div>

      {/* Warehouse Info Card */}
      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <h2 className="mb-5 text-lg font-bold text-[#191F28]">창고 정보</h2>
        <div className="grid grid-cols-2 gap-x-12 gap-y-4 md:grid-cols-3">
          <InfoItem icon={<Building2 className="h-4 w-4" />} label="창고 코드" value={warehouse.code} />
          <InfoItem icon={<Building2 className="h-4 w-4" />} label="창고명" value={warehouse.name} />
          <InfoItem icon={<Globe className="h-4 w-4" />} label="국가" value={warehouse.country} />
          <InfoItem icon={<MapPin className="h-4 w-4" />} label="도시" value={warehouse.city} />
          <InfoItem
            icon={<MapPin className="h-4 w-4" />}
            label="주소"
            value={`${warehouse.address}${warehouse.zipCode ? ` (${warehouse.zipCode})` : ""}`}
          />
          <InfoItem icon={<Clock className="h-4 w-4" />} label="시간대" value={warehouse.timezone} />
          {warehouse.contactName && (
            <InfoItem icon={<Building2 className="h-4 w-4" />} label="담당자" value={warehouse.contactName} />
          )}
          {warehouse.contactPhone && (
            <InfoItem icon={<Phone className="h-4 w-4" />} label="연락처" value={warehouse.contactPhone} />
          )}
          {warehouse.contactEmail && (
            <InfoItem icon={<Mail className="h-4 w-4" />} label="이메일" value={warehouse.contactEmail} />
          )}
          {warehouse.notes && (
            <div className="col-span-2 flex items-start gap-3">
              <div className="mt-0.5 text-[#B0B8C1]">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-[#8B95A1]">비고</p>
                <p className="text-sm font-medium text-[#191F28]">{warehouse.notes}</p>
              </div>
            </div>
          )}
          <InfoItem icon={<Clock className="h-4 w-4" />} label="등록일" value={formatDateTime(warehouse.createdAt)} />
        </div>
      </div>

      {/* Zone Management Section */}
      <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#191F28]">
            구역(Zone) 관리
            <span className="ml-2 text-sm font-normal text-[#8B95A1]">{zones.length}개</span>
          </h2>
          <button
            onClick={handleCreateZone}
            className="flex items-center gap-2 rounded-xl bg-[#3182F6] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1B64DA]"
          >
            <Plus className="h-4 w-4" />
            구역 추가
          </button>
        </div>

        {zonesError ? (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 p-5 text-sm text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            구역 데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        ) : zonesLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 w-full animate-pulse rounded-xl bg-[#F2F4F6]" />
            ))}
          </div>
        ) : zones.length === 0 ? (
          <div className="py-16 text-center text-sm text-[#B0B8C1]">
            등록된 구역이 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F7F8FA]">
                <tr>
                  <th className="w-10 px-3 py-4" />
                  <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-[#8B95A1]">코드</th>
                  <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-[#8B95A1]">구역명</th>
                  <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-[#8B95A1]">유형</th>
                  <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-[#8B95A1]">로케이션수</th>
                  <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-[#8B95A1]">설명</th>
                  <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-[#8B95A1]" />
                </tr>
              </thead>
              <tbody>
                {zones.map((zone) => (
                  <ZoneRow
                    key={zone.id}
                    zone={zone}
                    warehouseId={warehouseId}
                    isExpanded={expandedZoneId === zone.id}
                    onToggle={() => toggleZoneExpand(zone.id)}
                    onEdit={(e) => handleEditZone(e, zone)}
                    onDelete={(e) => handleDeleteZoneClick(e, zone)}
                    onCreateLocation={(e) => handleCreateLocation(e, zone.id)}
                    onEditLocation={(loc) => handleEditLocation(loc, zone.id)}
                    onDeleteLocation={(e, loc) => handleDeleteLocationClick(e, loc, zone.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Zone Form Modal */}
      <ZoneFormModal
        isOpen={isZoneFormOpen}
        onClose={() => setIsZoneFormOpen(false)}
        zone={editingZone}
        warehouseId={warehouseId}
        onSuccess={() => {}}
      />

      {/* Location Form Modal */}
      {locationZoneId && (
        <LocationFormModal
          isOpen={isLocationFormOpen}
          onClose={() => setIsLocationFormOpen(false)}
          location={editingLocation}
          warehouseId={warehouseId}
          zoneId={locationZoneId}
          onSuccess={() => {}}
        />
      )}

      {/* Zone Delete Confirm */}
      <ConfirmModal
        isOpen={!!deletingZone}
        onClose={() => setDeletingZone(undefined)}
        onConfirm={handleDeleteZoneConfirm}
        title="구역 삭제"
        message={`"${deletingZone?.name}" 구역을 삭제하시겠습니까? 하위 로케이션도 모두 삭제됩니다.`}
        confirmText="삭제"
        isLoading={deleteZoneMutation.isPending}
      />

      {/* Location Delete Confirm */}
      <LocationDeleteConfirm
        deletingLocation={deletingLocation}
        warehouseId={warehouseId}
        onClose={() => setDeletingLocation(undefined)}
      />
    </div>
  );
}

// ===== InfoItem sub-component =====

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-[#B0B8C1]">{icon}</div>
      <div>
        <p className="text-xs text-[#8B95A1]">{label}</p>
        <p className="text-sm font-medium text-[#191F28]">{value || "-"}</p>
      </div>
    </div>
  );
}

// ===== ZoneRow sub-component =====

interface ZoneRowProps {
  zone: Zone;
  warehouseId: string;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onCreateLocation: (e: React.MouseEvent) => void;
  onEditLocation: (location: Location) => void;
  onDeleteLocation: (e: React.MouseEvent, location: Location) => void;
}

function ZoneRow({
  zone,
  warehouseId,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onCreateLocation,
  onEditLocation,
  onDeleteLocation,
}: ZoneRowProps) {
  const { data: locationsResponse, isLoading: locLoading } = useLocations(
    warehouseId,
    isExpanded ? zone.id : undefined
  );
  const locations = locationsResponse?.data ?? [];

  return (
    <>
      {/* Zone header row */}
      <tr
        className="cursor-pointer border-b border-[#F2F4F6] transition-colors duration-200 hover:bg-[#F7F8FA]"
        onClick={onToggle}
      >
        <td className="px-3 py-4 text-[#8B95A1]">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </td>
        <td className="px-5 py-4 font-mono text-sm font-semibold text-[#333D4B]">{zone.code}</td>
        <td className="px-5 py-4 text-[#4E5968]">{zone.name}</td>
        <td className="px-5 py-4">
          <Badge status={zone.type} />
        </td>
        <td className="px-5 py-4 text-[#4E5968]">
          {locLoading && isExpanded ? (
            <span className="text-[#B0B8C1]">...</span>
          ) : isExpanded ? (
            locations.length
          ) : (
            "-"
          )}
        </td>
        <td className="px-5 py-4 text-[#8B95A1]">{zone.description || "-"}</td>
        <td className="px-5 py-4">
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => onEdit(e)}
              className="rounded-lg p-1.5 text-[#B0B8C1] transition-colors hover:bg-[#E8F2FF] hover:text-[#3182F6]"
              title="수정"
            >
              <Edit3 className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => onCreateLocation(e)}
              className="rounded-lg p-1.5 text-[#B0B8C1] transition-colors hover:bg-[#E8F7EF] hover:text-[#1FC47D]"
              title="로케이션 추가"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => onDelete(e)}
              className="rounded-lg p-1.5 text-[#B0B8C1] transition-colors hover:bg-red-50 hover:text-red-500"
              title="삭제"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded Location sub-table */}
      {isExpanded && (
        <tr>
          <td colSpan={7} className="bg-[#FAFBFC] px-0 py-0">
            <div className="border-t border-[#E5E8EB]">
              <div className="flex items-center justify-between px-8 py-3">
                <h4 className="text-sm font-semibold text-[#4E5968]">
                  로케이션 목록
                  <span className="ml-2 text-xs font-normal text-[#8B95A1]">{locations.length}개</span>
                </h4>
                <button
                  onClick={(e) => onCreateLocation(e)}
                  className="flex items-center gap-1.5 rounded-lg bg-[#E8F2FF] px-3 py-1.5 text-xs font-semibold text-[#3182F6] transition-colors hover:bg-[#D4E5FF]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  로케이션 추가
                </button>
              </div>

              {locLoading ? (
                <div className="px-8 pb-5">
                  <div className="space-y-2">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-[#E5E8EB]" />
                    ))}
                  </div>
                </div>
              ) : locations.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#B0B8C1]">
                  등록된 로케이션이 없습니다.
                </div>
              ) : (
                <div className="overflow-x-auto px-8 pb-5">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E5E8EB]">
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8B95A1]">코드</th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8B95A1]">Aisle</th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8B95A1]">Rack</th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8B95A1]">Level</th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8B95A1]">Bin</th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8B95A1]">상태</th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8B95A1]">최대중량(kg)</th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8B95A1]">최대용적(m3)</th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#8B95A1]" />
                      </tr>
                    </thead>
                    <tbody>
                      {locations.map((loc) => (
                        <tr
                          key={loc.id}
                          className="cursor-pointer border-b border-[#F2F4F6] transition-colors hover:bg-white"
                          onClick={() => onEditLocation(loc)}
                        >
                          <td className="px-4 py-3 font-mono text-sm font-medium text-[#333D4B]">{loc.code}</td>
                          <td className="px-4 py-3 text-[#4E5968]">{loc.aisle}</td>
                          <td className="px-4 py-3 text-[#4E5968]">{loc.rack}</td>
                          <td className="px-4 py-3 text-[#4E5968]">{loc.level}</td>
                          <td className="px-4 py-3 text-[#4E5968]">{loc.bin}</td>
                          <td className="px-4 py-3">
                            <Badge status={loc.status} />
                          </td>
                          <td className="px-4 py-3 text-[#4E5968]">{loc.maxWeight ? `${loc.maxWeight}` : "-"}</td>
                          <td className="px-4 py-3 text-[#4E5968]">{loc.maxVolume ? `${loc.maxVolume}` : "-"}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditLocation(loc);
                                }}
                                className="rounded-lg p-1 text-[#B0B8C1] transition-colors hover:bg-[#E8F2FF] hover:text-[#3182F6]"
                                title="수정"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={(e) => onDeleteLocation(e, loc)}
                                className="rounded-lg p-1 text-[#B0B8C1] transition-colors hover:bg-red-50 hover:text-red-500"
                                title="삭제"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ===== Location Delete Confirm sub-component =====

function LocationDeleteConfirm({
  deletingLocation,
  warehouseId,
  onClose,
}: {
  deletingLocation: { location: Location; zoneId: string } | undefined;
  warehouseId: string;
  onClose: () => void;
}) {
  const addToast = useToastStore((s) => s.addToast);
  const deleteMutation = useDeleteLocation(
    warehouseId,
    deletingLocation?.zoneId ?? ""
  );

  const handleConfirm = async () => {
    if (!deletingLocation) return;
    try {
      await deleteMutation.mutateAsync(deletingLocation.location.id);
      addToast({
        type: "success",
        message: `"${deletingLocation.location.code}" 로케이션이 삭제되었습니다.`,
      });
    } catch {
      addToast({ type: "error", message: "삭제 중 오류가 발생했습니다." });
    } finally {
      onClose();
    }
  };

  return (
    <ConfirmModal
      isOpen={!!deletingLocation}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="로케이션 삭제"
      message={`"${deletingLocation?.location.code}" 로케이션을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
      confirmText="삭제"
      isLoading={deleteMutation.isPending}
    />
  );
}
