import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class FlightsService {
    constructor(private prisma: PrismaService) { }

    findAll(filters?: {
        origin?: string;
        destination?: string;
        status?: string;
    }) {
        return this.prisma.flight.findMany({
            where: {
                deletedAt: null,
                ...(filters?.origin && { origin: filters.origin }),
                ...(filters?.destination && { destination: filters.destination }),
                ...(filters?.status && { status: filters.status as any }),
            },
        });
    }


    async softDelete(id: number) {
        return this.prisma.flight.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    async create(dto: {
        code: string;
        origin: string;
        destination: string;
        departureTime: string;
        arrivalTime: string;
        status?: string;
        planeId?: number;
    }) {
        return this.prisma.flight.create({
            data: {
                code: dto.code,
                origin: dto.origin,
                destination: dto.destination,
                departureTime: new Date(dto.departureTime),
                arrivalTime: new Date(dto.arrivalTime),
                status: (dto.status as any) ?? undefined,
                planeId: dto.planeId ?? null,
            },
        });
    }

}
