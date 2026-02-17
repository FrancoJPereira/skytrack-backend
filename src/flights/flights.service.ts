import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class FlightsService {
    constructor(private prisma: PrismaService) { }

    findAll(filters?: { origin?: string; destination?: string; status?: string }) {
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

    async update(
        id: number,
        dto: {
            code?: string;
            origin?: string;
            destination?: string;
            departureTime?: string;
            arrivalTime?: string;
            status?: string;
            planeId?: number | null;
        }
    ) {

        const existingFlight = await this.prisma.flight.findUnique({
            where: { id },
        });

        if (!existingFlight || existingFlight.deletedAt) {
            throw new Error("El vuelo no existe o fue eliminado");
        }


        const updatedFlight = await this.prisma.flight.update({
            where: { id },
            data: {
                ...(dto.code !== undefined && { code: dto.code }),
                ...(dto.origin !== undefined && { origin: dto.origin }),
                ...(dto.destination !== undefined && { destination: dto.destination }),
                ...(dto.departureTime !== undefined && {
                    departureTime: new Date(dto.departureTime),
                }),
                ...(dto.arrivalTime !== undefined && { arrivalTime: new Date(dto.arrivalTime) }),
                ...(dto.status !== undefined && { status: dto.status as any }),
                ...(dto.planeId !== undefined && { planeId: dto.planeId }),
            },
        });


        if (dto.status === "EN_VUELO" && updatedFlight.planeId) {
            await this.prisma.plane.update({
                where: { id: updatedFlight.planeId },
                data: { status: "EN_VUELO" },
            });
        }

        return updatedFlight;
    }
}
