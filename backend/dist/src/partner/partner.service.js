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
exports.PartnerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const pagination_dto_1 = require("../common/dto/pagination.dto");
let PartnerService = class PartnerService {
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
        if (query.type) {
            where.type = query.type;
        }
        const allowedSortFields = ['createdAt', 'code', 'name', 'type', 'status'];
        const sortBy = query.sortBy && allowedSortFields.includes(query.sortBy) ? query.sortBy : 'createdAt';
        const [data, total] = await Promise.all([
            this.prisma.partner.findMany({
                where,
                skip: query.skip,
                take: query.take,
                orderBy: { [sortBy]: query.sortOrder || 'desc' },
            }),
            this.prisma.partner.count({ where }),
        ]);
        return new pagination_dto_1.PaginatedResult(data, total, query.page, query.limit);
    }
    async findById(id) {
        const partner = await this.prisma.partner.findUnique({ where: { id } });
        if (!partner)
            throw new common_1.NotFoundException('거래처를 찾을 수 없습니다');
        return partner;
    }
    async create(dto) {
        const existing = await this.prisma.partner.findUnique({
            where: { code: dto.code },
        });
        if (existing)
            throw new common_1.ConflictException('이미 존재하는 거래처 코드입니다');
        return this.prisma.partner.create({ data: dto });
    }
    async update(id, dto) {
        await this.findById(id);
        return this.prisma.partner.update({ where: { id }, data: dto });
    }
    async delete(id) {
        await this.findById(id);
        const inboundCount = await this.prisma.inboundOrder.count({ where: { partnerId: id } });
        if (inboundCount > 0) {
            throw new common_1.BadRequestException('해당 거래처에 연결된 입고 주문이 있어 삭제할 수 없습니다.');
        }
        const outboundCount = await this.prisma.outboundOrder.count({ where: { partnerId: id } });
        if (outboundCount > 0) {
            throw new common_1.BadRequestException('해당 거래처에 연결된 출고 주문이 있어 삭제할 수 없습니다.');
        }
        return this.prisma.partner.delete({ where: { id } });
    }
};
exports.PartnerService = PartnerService;
exports.PartnerService = PartnerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PartnerService);
//# sourceMappingURL=partner.service.js.map