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
exports.CommonCodeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const pagination_dto_1 = require("../common/dto/pagination.dto");
let CommonCodeService = class CommonCodeService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const where = {};
        if (query.search) {
            where.OR = [
                { codeType: { contains: query.search } },
                { typeNm: { contains: query.search } },
                { code: { contains: query.search } },
                { codeNm: { contains: query.search } },
            ];
        }
        if (query.groupCode) {
            where.codeType = query.groupCode;
        }
        const allowedSortFields = ['createdAt', 'codeType', 'code', 'sortOrder'];
        const sortBy = query.sortBy && allowedSortFields.includes(query.sortBy) ? query.sortBy : 'createdAt';
        const [data, total] = await Promise.all([
            this.prisma.commonCode.findMany({
                where,
                skip: query.skip,
                take: query.take,
                orderBy: { [sortBy]: query.sortOrder || 'desc' },
            }),
            this.prisma.commonCode.count({ where }),
        ]);
        return new pagination_dto_1.PaginatedResult(data, total, query.page, query.limit);
    }
    async findById(id) {
        const item = await this.prisma.commonCode.findUnique({ where: { id } });
        if (!item)
            throw new common_1.NotFoundException('공통코드를 찾을 수 없습니다');
        return item;
    }
    async create(dto) {
        const existing = await this.prisma.commonCode.findUnique({
            where: { codeType_code: { codeType: dto.codeType, code: dto.code } },
        });
        if (existing)
            throw new common_1.ConflictException('이미 존재하는 공통코드입니다');
        return this.prisma.commonCode.create({ data: dto });
    }
    async update(id, dto) {
        await this.findById(id);
        return this.prisma.commonCode.update({ where: { id }, data: dto });
    }
    async delete(id) {
        await this.findById(id);
        return this.prisma.commonCode.delete({ where: { id } });
    }
};
exports.CommonCodeService = CommonCodeService;
exports.CommonCodeService = CommonCodeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CommonCodeService);
//# sourceMappingURL=common-code.service.js.map