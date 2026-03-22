import { Module } from '@nestjs/common';
import { ExcelService } from './services/excel.service';
import { ExportController } from './controllers/export.controller';

@Module({
  controllers: [ExportController],
  providers: [ExcelService],
  exports: [ExcelService],
})
export class ExportModule {}
