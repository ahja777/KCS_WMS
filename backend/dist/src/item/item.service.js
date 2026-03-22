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
exports.ItemService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const pagination_dto_1 = require("../common/dto/pagination.dto");
let ItemService = class ItemService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const where = {};
        if (query.search) {
            where.OR = [
                { code: { contains: query.search } },
                { name: { contains: query.search } },
                { barcode: { contains: query.search } },
            ];
        }
        if (query.category)
            where.category = query.category;
        if (query.isActive !== undefined)
            where.isActive = query.isActive === 'true';
        const allowedSortFields = ['createdAt', 'code', 'name', 'barcode', 'category', 'status'];
        const sortBy = query.sortBy && allowedSortFields.includes(query.sortBy) ? query.sortBy : 'createdAt';
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.item.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: query.sortOrder || 'desc' },
            }),
            this.prisma.item.count({ where }),
        ]);
        return new pagination_dto_1.PaginatedResult(data, total, page, limit);
    }
    async findById(id) {
        const item = await this.prisma.item.findUnique({ where: { id } });
        if (!item)
            throw new common_1.NotFoundException('품목을 찾을 수 없습니다');
        return item;
    }
    async findByCode(code) {
        const item = await this.prisma.item.findUnique({ where: { code } });
        if (!item)
            throw new common_1.NotFoundException('품목을 찾을 수 없습니다');
        return item;
    }
    async create(dto) {
        const existing = await this.prisma.item.findUnique({
            where: { code: dto.code },
        });
        if (existing)
            throw new common_1.ConflictException('이미 존재하는 품목 코드입니다');
        if (dto.barcode) {
            const barcodeExists = await this.prisma.item.findUnique({
                where: { barcode: dto.barcode },
            });
            if (barcodeExists)
                throw new common_1.ConflictException('이미 존재하는 바코드입니다');
        }
        return this.prisma.item.create({ data: dto });
    }
    async update(id, dto) {
        await this.findById(id);
        return this.prisma.item.update({ where: { id }, data: dto });
    }
    async delete(id) {
        await this.findById(id);
        const inboundItemCount = await this.prisma.inboundOrderItem.count({ where: { itemId: id } });
        if (inboundItemCount > 0) {
            throw new common_1.BadRequestException('해당 품목에 연결된 입고 주문 항목이 있어 삭제할 수 없습니다.');
        }
        const outboundItemCount = await this.prisma.outboundOrderItem.count({ where: { itemId: id } });
        if (outboundItemCount > 0) {
            throw new common_1.BadRequestException('해당 품목에 연결된 출고 주문 항목이 있어 삭제할 수 없습니다.');
        }
        const inventoryCount = await this.prisma.inventory.count({ where: { itemId: id } });
        if (inventoryCount > 0) {
            throw new common_1.BadRequestException('해당 품목에 연결된 재고가 있어 삭제할 수 없습니다.');
        }
        return this.prisma.item.delete({ where: { id } });
    }
};
exports.ItemService = ItemService;
exports.ItemService = ItemService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ItemService);
//# sourceMappingURL=item.service.js.map