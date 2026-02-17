import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PlanesService {
    constructor(private prisma: PrismaService) { }

    findAll() {
        return this.prisma.plane.findMany();
    }

    async create(dto: { model: string; registration: string; status?: string }) {
        return this.prisma.plane.create({
            data: {
                model: dto.model,
                registration: dto.registration,
                status: (dto.status as any) ?? undefined,
            },
        });

    }

    async update(id: number, dto: { model?: string; registration?: string; status?: string }) {
        return this.prisma.plane.update({
            where: { id },
            data: {
                ...(dto.model !== undefined && { model: dto.model }),
                ...(dto.registration !== undefined && { registration: dto.registration }),
                ...(dto.status !== undefined && { status: dto.status as any }),
            },
        });
    }


}




