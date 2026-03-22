import { Controller, Get, Post, Put, Delete, Param, Body, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

// ═══════════════════════════════════════════════════════════════
// Role Controller (TMSYS050: 권한관리)
// ═══════════════════════════════════════════════════════════════
@ApiTags('roles')
@Controller('roles')
export class RoleController {
  constructor(private prisma: PrismaService) {}

  @Get() @ApiOperation({ summary: '권한 목록' })
  async findAll(@Query() query: any) {
    const { page = 1, limit = 20, search } = query;
    const where = search ? { name: { contains: search } } : {};
    const [data, total] = await Promise.all([
      this.prisma.role.findMany({ where, skip: (+page - 1) * +limit, take: +limit, include: { programs: true }, orderBy: { createdAt: 'desc' } }),
      this.prisma.role.count({ where }),
    ]);
    return { data, meta: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / +limit) } };
  }

  @Get(':id') @ApiOperation({ summary: '권한 상세' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.prisma.role.findUniqueOrThrow({ where: { id }, include: { programs: { include: { program: true } } } });
  }

  @Post() @ApiOperation({ summary: '권한 생성' })
  async create(@Body() dto: any) { return this.prisma.role.create({ data: dto }); }

  @Put(':id') @ApiOperation({ summary: '권한 수정' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any) { return this.prisma.role.update({ where: { id }, data: dto }); }

  @Delete(':id') @ApiOperation({ summary: '권한 삭제' })
  async remove(@Param('id', ParseUUIDPipe) id: string) { return this.prisma.role.delete({ where: { id } }); }
}

// ═══════════════════════════════════════════════════════════════
// Program Controller (TMSYS040: 프로그램관리)
// ═══════════════════════════════════════════════════════════════
@ApiTags('programs')
@Controller('programs')
export class ProgramController {
  constructor(private prisma: PrismaService) {}

  @Get() @ApiOperation({ summary: '프로그램 목록' })
  async findAll(@Query() query: any) {
    const { page = 1, limit = 100, search } = query;
    const where = search ? { name: { contains: search } } : {};
    const [data, total] = await Promise.all([
      this.prisma.program.findMany({ where, skip: (+page - 1) * +limit, take: +limit, include: { children: true }, orderBy: [{ menuLevel: 'asc' }, { sortOrder: 'asc' }] }),
      this.prisma.program.count({ where }),
    ]);
    return { data, meta: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / +limit) } };
  }

  @Get(':id') @ApiOperation({ summary: '프로그램 상세' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.prisma.program.findUniqueOrThrow({ where: { id }, include: { children: true, parent: true } });
  }

  @Post() @ApiOperation({ summary: '프로그램 생성' })
  async create(@Body() dto: any) { return this.prisma.program.create({ data: dto }); }

  @Put(':id') @ApiOperation({ summary: '프로그램 수정' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any) { return this.prisma.program.update({ where: { id }, data: dto }); }

  @Delete(':id') @ApiOperation({ summary: '프로그램 삭제' })
  async remove(@Param('id', ParseUUIDPipe) id: string) { return this.prisma.program.delete({ where: { id } }); }
}

// ═══════════════════════════════════════════════════════════════
// RoleProgram Controller (권한-프로그램 매핑)
// ═══════════════════════════════════════════════════════════════
@ApiTags('role-programs')
@Controller('role-programs')
export class RoleProgramController {
  constructor(private prisma: PrismaService) {}

  @Get() @ApiOperation({ summary: '권한-프로그램 매핑 목록' })
  async findAll(@Query() query: any) {
    const { roleId, page = 1, limit = 100 } = query;
    const where = roleId ? { roleId } : {};
    const [data, total] = await Promise.all([
      this.prisma.roleProgram.findMany({ where, skip: (+page - 1) * +limit, take: +limit, include: { role: true, program: true } }),
      this.prisma.roleProgram.count({ where }),
    ]);
    return { data, meta: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / +limit) } };
  }

  @Post() @ApiOperation({ summary: '권한-프로그램 매핑 생성' })
  async create(@Body() dto: any) { return this.prisma.roleProgram.create({ data: dto }); }

  @Put(':id') @ApiOperation({ summary: '권한-프로그램 매핑 수정' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any) { return this.prisma.roleProgram.update({ where: { id }, data: dto }); }

  @Delete(':id') @ApiOperation({ summary: '권한-프로그램 매핑 삭제' })
  async remove(@Param('id', ParseUUIDPipe) id: string) { return this.prisma.roleProgram.delete({ where: { id } }); }
}

// ═══════════════════════════════════════════════════════════════
// Multilingual Controller (WMSYS020: 다국어관리)
// ═══════════════════════════════════════════════════════════════
@ApiTags('multilinguals')
@Controller('multilinguals')
export class MultilingualController {
  constructor(private prisma: PrismaService) {}

  @Get() @ApiOperation({ summary: '다국어 목록' })
  async findAll(@Query() query: any) {
    const { page = 1, limit = 50, search, langCode, module } = query;
    const where: any = {};
    if (search) where.msgKey = { contains: search };
    if (langCode) where.langCode = langCode;
    if (module) where.module = module;
    const [data, total] = await Promise.all([
      this.prisma.multilingual.findMany({ where, skip: (+page - 1) * +limit, take: +limit, orderBy: { msgKey: 'asc' } }),
      this.prisma.multilingual.count({ where }),
    ]);
    return { data, meta: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / +limit) } };
  }

  @Post() @ApiOperation({ summary: '다국어 생성' })
  async create(@Body() dto: any) { return this.prisma.multilingual.create({ data: dto }); }

  @Put(':id') @ApiOperation({ summary: '다국어 수정' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any) { return this.prisma.multilingual.update({ where: { id }, data: dto }); }

  @Delete(':id') @ApiOperation({ summary: '다국어 삭제' })
  async remove(@Param('id', ParseUUIDPipe) id: string) { return this.prisma.multilingual.delete({ where: { id } }); }
}

// ═══════════════════════════════════════════════════════════════
// Template Controller (WMSTP010: 템플릿관리)
// ═══════════════════════════════════════════════════════════════
@ApiTags('templates')
@Controller('templates')
export class TemplateController {
  constructor(private prisma: PrismaService) {}

  @Get() @ApiOperation({ summary: '템플릿 목록' })
  async findAll(@Query() query: any) {
    const { page = 1, limit = 20, search, templateType } = query;
    const where: any = {};
    if (search) where.name = { contains: search };
    if (templateType) where.templateType = templateType;
    const [data, total] = await Promise.all([
      this.prisma.template.findMany({ where, skip: (+page - 1) * +limit, take: +limit, include: { columns: true }, orderBy: { createdAt: 'desc' } }),
      this.prisma.template.count({ where }),
    ]);
    return { data, meta: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / +limit) } };
  }

  @Get(':id') @ApiOperation({ summary: '템플릿 상세' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.prisma.template.findUniqueOrThrow({ where: { id }, include: { columns: { orderBy: { colSeq: 'asc' } }, ownerTemplates: { include: { columns: true } } } });
  }

  @Post() @ApiOperation({ summary: '템플릿 생성' })
  async create(@Body() dto: any) { return this.prisma.template.create({ data: dto }); }

  @Put(':id') @ApiOperation({ summary: '템플릿 수정' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any) { return this.prisma.template.update({ where: { id }, data: dto }); }

  @Delete(':id') @ApiOperation({ summary: '템플릿 삭제' })
  async remove(@Param('id', ParseUUIDPipe) id: string) { return this.prisma.template.delete({ where: { id } }); }
}

// ═══════════════════════════════════════════════════════════════
// WorkPolicy Controller (WMSMS020: 센터별작업정책)
// ═══════════════════════════════════════════════════════════════
@ApiTags('work-policies')
@Controller('work-policies')
export class WorkPolicyController {
  constructor(private prisma: PrismaService) {}

  @Get() @ApiOperation({ summary: '작업정책 목록' })
  async findAll(@Query() query: any) {
    const { page = 1, limit = 20, warehouseId, policyType } = query;
    const where: any = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (policyType) where.policyType = policyType;
    const [data, total] = await Promise.all([
      this.prisma.workPolicy.findMany({ where, skip: (+page - 1) * +limit, take: +limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.workPolicy.count({ where }),
    ]);
    return { data, meta: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / +limit) } };
  }

  @Post() @ApiOperation({ summary: '작업정책 생성' })
  async create(@Body() dto: any) { return this.prisma.workPolicy.create({ data: dto }); }

  @Put(':id') @ApiOperation({ summary: '작업정책 수정' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any) { return this.prisma.workPolicy.update({ where: { id }, data: dto }); }

  @Delete(':id') @ApiOperation({ summary: '작업정책 삭제' })
  async remove(@Param('id', ParseUUIDPipe) id: string) { return this.prisma.workPolicy.delete({ where: { id } }); }
}

// ═══════════════════════════════════════════════════════════════
// Helpdesk Controller (TMSYS130)
// ═══════════════════════════════════════════════════════════════
@ApiTags('helpdesks')
@Controller('helpdesks')
export class HelpdeskController {
  constructor(private prisma: PrismaService) {}

  @Get() @ApiOperation({ summary: 'HelpDesk 목록' })
  async findAll(@Query() query: any) {
    const { page = 1, limit = 20, search, status, category } = query;
    const where: any = {};
    if (search) where.title = { contains: search };
    if (status) where.status = status;
    if (category) where.category = category;
    const [data, total] = await Promise.all([
      this.prisma.helpdesk.findMany({ where, skip: (+page - 1) * +limit, take: +limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.helpdesk.count({ where }),
    ]);
    return { data, meta: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / +limit) } };
  }

  @Get(':id') @ApiOperation({ summary: 'HelpDesk 상세' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) { return this.prisma.helpdesk.findUniqueOrThrow({ where: { id } }); }

  @Post() @ApiOperation({ summary: 'HelpDesk 생성' })
  async create(@Body() dto: any) { return this.prisma.helpdesk.create({ data: dto }); }

  @Put(':id') @ApiOperation({ summary: 'HelpDesk 수정' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any) { return this.prisma.helpdesk.update({ where: { id }, data: dto }); }

  @Delete(':id') @ApiOperation({ summary: 'HelpDesk 삭제' })
  async remove(@Param('id', ParseUUIDPipe) id: string) { return this.prisma.helpdesk.delete({ where: { id } }); }
}

// ═══════════════════════════════════════════════════════════════
// SettlementRate Controller (WMSAC010: 정산단가관리)
// ═══════════════════════════════════════════════════════════════
@ApiTags('settlement-rates')
@Controller('settlement-rates')
export class SettlementRateController {
  constructor(private prisma: PrismaService) {}

  @Get() @ApiOperation({ summary: '정산단가 목록' })
  async findAll(@Query() query: any) {
    const { page = 1, limit = 20, warehouseId, rateType } = query;
    const where: any = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (rateType) where.rateType = rateType;
    const [data, total] = await Promise.all([
      this.prisma.settlementRate.findMany({ where, skip: (+page - 1) * +limit, take: +limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.settlementRate.count({ where }),
    ]);
    return { data, meta: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / +limit) } };
  }

  @Post() @ApiOperation({ summary: '정산단가 생성' })
  async create(@Body() dto: any) { return this.prisma.settlementRate.create({ data: dto }); }

  @Put(':id') @ApiOperation({ summary: '정산단가 수정' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any) { return this.prisma.settlementRate.update({ where: { id }, data: dto }); }

  @Delete(':id') @ApiOperation({ summary: '정산단가 삭제' })
  async remove(@Param('id', ParseUUIDPipe) id: string) { return this.prisma.settlementRate.delete({ where: { id } }); }
}
