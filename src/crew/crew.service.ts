import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CrewService {
    constructor(private prisma: PrismaService) { }

    findAll() {
        return this.prisma.crewMember.findMany({
            where: { deletedAt: null },
            orderBy: { id: "asc" },
        });
    }

    create(dto: { fullName: string; role: string }) {
        return this.prisma.crewMember.create({
            data: {
                fullName: dto.fullName,
                role: dto.role,
            },
        });
    }

    async update(id: number, dto: { fullName?: string; role?: string }) {
        const exists = await this.prisma.crewMember.findUnique({ where: { id } });
        if (!exists || exists.deletedAt) {
            throw new NotFoundException("El tripulante no existe o fue eliminado");
        }

        return this.prisma.crewMember.update({
            where: { id },
            data: {
                ...(dto.fullName !== undefined && { fullName: dto.fullName }),
                ...(dto.role !== undefined && { role: dto.role }),
            },
        });
    }

    async softDelete(id: number) {
        const exists = await this.prisma.crewMember.findUnique({ where: { id } });
        if (!exists) throw new NotFoundException("Tripulante no encontrado");
        if (exists.deletedAt) throw new BadRequestException("El tripulante ya fue eliminado");

        // Regla: no se puede eliminar si está asignado a un vuelo
        const assigned = await this.prisma.flightCrew.findFirst({
            where: { crewMemberId: id },
        });
        if (assigned) {
            throw new BadRequestException("No se puede eliminar: el tripulante está asignado a un vuelo");
        }

        return this.prisma.crewMember.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
}
