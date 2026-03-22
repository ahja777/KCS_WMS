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
exports.UomService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const pagination_dto_1 = require("../common/dto/pagination.dto");
let UomService = class UomService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const where = {};
        if (query.search) {
            where.OR = [
                { code: { contains: query.search } },
                { name: { contains: query.search } },
            ];
        }
        const allowedSortFields = ['createdAt', 'code', 'name'];
        const sortBy = query.sortBy && allowedSortFields.includes(query.sortBy) ? query.sortBy : 'createdAt';
        const [data, total] = await Promise.all([
            this.prisma.uomMaster.findMany({
                where,
                skip: query.skip,
                take: query.take,
                orderBy: { [sortBy]: query.sortOrder || 'desc' },
            }),
            this.prisma.uomMaster.count({ where }),
        ]);
        return new pagination_dto_1.PaginatedResult(data, total, query.page, query.limit);
    }
    async findById(id) {
        const item = await this.prisma.uomMaster.findUnique({
            where: { id },
            include: {
                conversionsFrom: {
                    include: { toUom: true, item: { select: { id: true, code: true, name: true } } },
                },
            },
        });
        if (!item)
            throw new common_1.NotFoundException('UOM을 찾을 수 없습니다');
        return item;
    }
    async create(dto) {
        const existing = await this.prisma.uomMaster.findUnique({
            where: { code: dto.code },
        });
        if (existing)
            throw new common_1.ConflictException('이미 존재하는 UOM 코드입니다');
        return this.prisma.uomMaster.create({ data: dto });
    }
    async update(id, dto) {
        await this.findById(id);
        return this.prisma.uomMaster.update({ where: { id }, data: dto });
    }
    async delete(id) {
        await this.findById(id);
        const convCount = await this.prisma.uomConversion.count({
            where: { OR: [{ fromUomId: id }, { toUomId: id }] },
        });
        if (convCount > 0) {
            throw new common_1.BadRequestException('해당 UOM에 연결된 환산 정보가 있어 삭제할 수 없습니다');
        }
        return this.prisma.uomMaster.delete({ where: { id } });
    }
    async findConversions(uomId) {
        await this.findById(uomId);
        return this.prisma.uomConversion.findMany({
            where: { fromUomId: uomId },
            include: {
                toUom: true,
                item: { select: { id: true, code: true, name: true } },
            },
        });
    }
    async createConversion(uomId, dto) {
        await this.findById(uomId);
        const toUom = await this.prisma.uomMaster.findUnique({ where: { id: dto.toUomId } });
        if (!toUom)
            throw new common_1.NotFoundException('변환 대상 UOM을 찾을 수 없습니다');
        return this.prisma.uomConversion.create({
            data: {
                fromUomId: uomId,
                toUomId: dto.toUomId,
                convQty: dto.convQty,
                itemId: dto.itemId || null,
                startDate: dto.startDate || null,
                endDate: dto.endDate || null,
            },
        });
    }
};
exports.UomService = UomService;
exports.UomService = UomService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UomService);
//# sourceMappingURL=uom.service.js.map