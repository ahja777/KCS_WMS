"use client";

import { useMemo } from "react";
import { useAuthStore } from "@/stores/auth.store";
import type { UserRole } from "@/types";

interface Permissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  canImport: boolean;
  role: UserRole | undefined;
}

// 모듈별 권한 정의
const MODULE_PERMISSIONS: Record<string, Record<UserRole, { create: boolean; edit: boolean; delete: boolean; import: boolean }>> = {
  users: {
    ADMIN:    { create: true,  edit: true,  delete: true,  import: false },
    MANAGER:  { create: true,  edit: true,  delete: false, import: false },
    OPERATOR: { create: false, edit: false, delete: false, import: false },
    VIEWER:   { create: false, edit: false, delete: false, import: false },
  },
  warehouses: {
    ADMIN:    { create: true,  edit: true,  delete: true,  import: true },
    MANAGER:  { create: true,  edit: true,  delete: false, import: true },
    OPERATOR: { create: false, edit: false, delete: false, import: false },
    VIEWER:   { create: false, edit: false, delete: false, import: false },
  },
  items: {
    ADMIN:    { create: true,  edit: true,  delete: true,  import: true },
    MANAGER:  { create: true,  edit: true,  delete: false, import: true },
    OPERATOR: { create: false, edit: false, delete: false, import: false },
    VIEWER:   { create: false, edit: false, delete: false, import: false },
  },
  partners: {
    ADMIN:    { create: true,  edit: true,  delete: true,  import: true },
    MANAGER:  { create: true,  edit: true,  delete: false, import: true },
    OPERATOR: { create: false, edit: false, delete: false, import: false },
    VIEWER:   { create: false, edit: false, delete: false, import: false },
  },
  inbound: {
    ADMIN:    { create: true,  edit: true,  delete: true,  import: true },
    MANAGER:  { create: true,  edit: true,  delete: true,  import: true },
    OPERATOR: { create: true,  edit: true,  delete: false, import: false },
    VIEWER:   { create: false, edit: false, delete: false, import: false },
  },
  outbound: {
    ADMIN:    { create: true,  edit: true,  delete: true,  import: true },
    MANAGER:  { create: true,  edit: true,  delete: true,  import: true },
    OPERATOR: { create: true,  edit: true,  delete: false, import: false },
    VIEWER:   { create: false, edit: false, delete: false, import: false },
  },
  inventory: {
    ADMIN:    { create: true,  edit: true,  delete: false, import: true },
    MANAGER:  { create: true,  edit: true,  delete: false, import: true },
    OPERATOR: { create: true,  edit: true,  delete: false, import: false },
    VIEWER:   { create: false, edit: false, delete: false, import: false },
  },
};

export function usePermission(module: string): Permissions {
  const role = useAuthStore((s) => s.user?.role) as UserRole | undefined;

  return useMemo(() => {
    if (!role) {
      return { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, canImport: false, role: undefined };
    }

    const perms = MODULE_PERMISSIONS[module];
    if (!perms) {
      // Default: all roles can view/export, only ADMIN/MANAGER can create/edit
      return {
        canView: true,
        canCreate: ["ADMIN", "MANAGER"].includes(role),
        canEdit: ["ADMIN", "MANAGER"].includes(role),
        canDelete: role === "ADMIN",
        canExport: true,
        canImport: ["ADMIN", "MANAGER"].includes(role),
        role,
      };
    }

    const rolePerms = perms[role];
    return {
      canView: true,
      canCreate: rolePerms.create,
      canEdit: rolePerms.edit,
      canDelete: rolePerms.delete,
      canExport: true, // 모든 역할 엑셀/PDF 다운로드 가능
      canImport: rolePerms.import,
      role,
    };
  }, [role, module]);
}
