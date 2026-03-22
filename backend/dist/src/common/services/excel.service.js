"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcelService = void 0;
const common_1 = require("@nestjs/common");
const ExcelJS = __importStar(require("exceljs"));
let ExcelService = class ExcelService {
    async generateExcel(sheetName, columns, data) {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'KCS WMS';
        workbook.created = new Date();
        const worksheet = workbook.addWorksheet(sheetName);
        worksheet.columns = columns.map((col) => ({
            header: col.header,
            key: col.key,
            width: col.width ?? Math.max(col.header.length * 2 + 4, 14),
        }));
        data.forEach((row) => worksheet.addRow(row));
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, size: 11 };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF7F8FA' },
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 28;
        columns.forEach((_, colIdx) => {
            const column = worksheet.getColumn(colIdx + 1);
            let maxLen = columns[colIdx].header.length * 2 + 4;
            column.eachCell({ includeEmpty: false }, (cell) => {
                const cellLen = cell.value ? String(cell.value).length + 4 : 0;
                if (cellLen > maxLen)
                    maxLen = cellLen;
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFE5E8EB' } },
                    bottom: { style: 'thin', color: { argb: 'FFE5E8EB' } },
                    left: { style: 'thin', color: { argb: 'FFE5E8EB' } },
                    right: { style: 'thin', color: { argb: 'FFE5E8EB' } },
                };
            });
            column.width = Math.min(maxLen, 40);
        });
        for (let i = 2; i <= data.length + 1; i++) {
            const row = worksheet.getRow(i);
            row.alignment = { vertical: 'middle' };
            row.height = 24;
        }
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
};
exports.ExcelService = ExcelService;
exports.ExcelService = ExcelService = __decorate([
    (0, common_1.Injectable)()
], ExcelService);
//# sourceMappingURL=excel.service.js.map