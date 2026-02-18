import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CrewService {
    constructor(private prisma: PrismaService) { }

    findAll() {
        return this.prisma.crewMember.findMany();
    }

    async create(dto: { fullName: string; role: string }) {
        return this.prisma.crewMember.create({ data: dto });
    }

    async update(id: number, dto: { fullName?: string; role?: string }) {
        // opcional: validar que exista
        const exists = await this.prisma.crewMember.findUnique({ where: { id } });
        if (!exists) throw new NotFoundException("Tripulante no encontrado");

        return this.prisma.crewMember.update({
            where: { id },
            data: {
                ...(dto.fullName !== undefined && { fullName: dto.fullName }),
                ...(dto.role !== undefined && { role: dto.role }),
            },
        });
    }
}
