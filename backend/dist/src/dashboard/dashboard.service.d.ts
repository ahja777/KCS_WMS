import { PrismaService } from '../prisma/prisma.service';
export declare class DashboardService {
    private prisma;
    constructor(prisma: PrismaService);
    getStatistics(warehouseId?: string): Promise<{
        inventory: {
            totalQuantity: number;
            reservedQuantity: number;
            availableQuantity: number;
            inventoryRecords: number;
            uniqueItemsInStock: number;
        };
        inbound: {
            byStatus: {};
            recentCount: number;
            pendingCount: number;
        };
        outbound: {
            byStatus: {};
            recentCount: number;
            pendingCount: number;
        };
        alerts: {
            lowStockItems: {
                totalQty: number;
                id: string;
                name: string;
                code: string;
                minStock: number;
            }[];
            recentTransactions: number;
        };
        warehouses: {
            activeCount: number;
        };
    }>;
    private getLowStockItems;
}
