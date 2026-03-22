"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const pagination_dto_1 = require("../common/dto/pagination.dto");
let DockService = class DockService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const where = {};
        if (query.warehouseId) {
            where.warehouseId = query.warehouseId;
        }
        if (query.search) {
            where.OR = [
                { code: { contains: query.search } },
                { name: { contains: query.search } },
            ];
        }
        const allowedSortFields = ['createdAt', 'code', 'name', 'sortOrder'];
        const sortBy = query.sortBy && allowedSortFields.includes(query.sortBy) ? query.sortBy : 'sortOrder';
        const [data, total] = await Promise.all([
            this.prisma.dock.findMany({
                where,
                skip: query.skip,
                take: query.take,
                orderBy: { [sortBy]: query.sortOrder || 'asc' },
                include: { warehouse: { select: { id: true, name: true, code: true } } },
            }),
            this.prisma.dock.count({ where }),
        ]);
        return new pagination_dto_1.PaginatedResult(data, total, query.page, query.limit);
    }
    async findById(id) {
        const item = await this.prisma.dock.findUnique({
            where: { id },
            include: { warehouse: { select: { id: true, name: true, code: true } } },
        });
        if (!item)
            throw new common_1.NotFoundException('도크를 찾을 수 없습니다');
        return item;
    }
    async create(dto) {
        const existing = await this.prisma.dock.findUnique({
            where: { warehouseId_code: { warehouseId: dto.warehouseId, code: dto.code } },
        });
        if (existing)
            throw new common_1.ConflictException('해당 창고에 이미 존재하는 도크 코드입니다');
        return this.prisma.dock.create({ data: dto });
    }
    async update(id, dto) {
        await this.findById(id);
        return this.prisma.dock.update({ where: { id }, data: dto });
    }
    async delete(id) {
        await this.findById(id);
        return this.prisma.dock.delete({ where: { id } });
    }
};
exports.DockService = DockService;
exports.DockService = DockService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DockService);
//# sourceMappingURL=dock.service.js.map