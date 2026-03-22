import { Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { ExcelService } from '../services/excel.service';
export declare class ExportController {
    private readonly prisma;
    private readonly excelService;
    constructor(prisma: PrismaService, excelService: ExcelService);
    private setExportWarningHeader;
    private formatDate;
    private formatDateTime;
    private getFilename;
    private setExcelHeaders;
    exportInventory(warehouseId: string, res: Response): Promise<void>;
    exportItems(res: Response): Promise<void>;
    exportInbound(status: string, warehouseId: string, res: Response): Promise<void>;
    exportOutbound(status: string, warehouseId: string, res: Response): Promise<void>;
    exportPartners(type: string, res: Response): Promise<void>;
    exportWarehouses(res: Response): Promise<void>;
    exportChannelOrders(channelId: string, status: string, res: Response): Promise<void>;
}
