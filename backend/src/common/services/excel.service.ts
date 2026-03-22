import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

@Injectable()
export class ExcelService {
  async generateExcel(
    sheetName: string,
    columns: ExcelColumn[],
    data: Record<string, any>[],
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'KCS WMS';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(sheetName);

    // Set columns
    worksheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width ?? Math.max(col.header.length * 2 + 4, 14),
    }));

    // Add data rows
    data.forEach((row) => worksheet.addRow(row));

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF7F8FA' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 28;

    // Auto-width based on content & apply borders
    columns.forEach((_, colIdx) => {
      const column = worksheet.getColumn(colIdx + 1);
      let maxLen = columns[colIdx].header.length * 2 + 4;

      column.eachCell({ includeEmpty: false }, (cell) => {
        const cellLen = cell.value ? String(cell.value).length + 4 : 0;
        if (cellLen > maxLen) maxLen = cellLen;

        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E8EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E8EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E8EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E8EB' } },
        };
      });

      column.width = Math.min(maxLen, 40);
    });

    // Data rows alignment
    for (let i = 2; i <= data.length + 1; i++) {
      const row = worksheet.getRow(i);
      row.alignment = { vertical: 'middle' };
      row.height = 24;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
