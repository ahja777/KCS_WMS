import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
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
}
