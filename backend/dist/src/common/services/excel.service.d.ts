export interface ExcelColumn {
    header: string;
    key: string;
    width?: number;
}
export declare class ExcelService {
    generateExcel(sheetName: string, columns: ExcelColumn[], data: Record<string, any>[]): Promise<Buffer>;
}
