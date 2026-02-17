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
        // 1️⃣ Traemos el vuelo primero
        const flight = await this.prisma.flight.findUnique({
            where: { id },
        });

        if (!flight) {
            throw new Error("Vuelo no encontrado");
        }

        // 2️⃣ Si tenía avión asignado, lo liberamos
        if (flight.planeId) {
            await this.prisma.plane.update({
                where: { id: flight.planeId },
                data: { status: "DISPONIBLE" },
            });
        }

        // 3️⃣ Soft delete
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
        // Validar avión si viene planeId
        if (dto.planeId) {
            const plane = await this.prisma.plane.findUnique({
                where: { id: dto.planeId },
            });

            if (!plane) {
                throw new Error("El avión no existe");
            }

            if (plane.status !== "DISPONIBLE") {
                throw new Error("El avión no está DISPONIBLE");
            }
        }

        const created = await this.prisma.flight.create({
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

        // Si el vuelo nace EN_VUELO, marcar el avión como EN_VUELO
        if (created.planeId && created.status === "EN_VUELO") {
            await this.prisma.plane.update({
                where: { id: created.planeId },
                data: { status: "EN_VUELO" },
            });
        }

        return created;
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

        const previousPlaneId = existingFlight.planeId;

        // Validar avión si se quiere cambiar planeId (y no es null)
        if (dto.planeId !== undefined && dto.planeId !== null) {
            const plane = await this.prisma.plane.findUnique({
                where: { id: dto.planeId },
            });

            if (!plane) {
                throw new Error("El avión no existe");
            }

            if (plane.status !== "DISPONIBLE") {
                throw new Error("El avión no está DISPONIBLE");
            }
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
                ...(dto.arrivalTime !== undefined && {
                    arrivalTime: new Date(dto.arrivalTime),
                }),
                ...(dto.status !== undefined && { status: dto.status as any }),
                ...(dto.planeId !== undefined && { planeId: dto.planeId }),
            },
        });

        // ✅ PASO 20 — liberar avión anterior si cambió o si desasignaron (planeId: null)
        if (dto.planeId === null && previousPlaneId) {
            await this.prisma.plane.update({
                where: { id: previousPlaneId },
                data: { status: "DISPONIBLE" },
            });
        }

        if (
            dto.planeId !== undefined &&
            dto.planeId !== null &&
            previousPlaneId &&
            dto.planeId !== previousPlaneId
        ) {
            await this.prisma.plane.update({
                where: { id: previousPlaneId },
                data: { status: "DISPONIBLE" },
            });
        }

        // Sincronizar estado del avión nuevo según el estado final del vuelo
        if (updatedFlight.planeId) {
            if (updatedFlight.status === "EN_VUELO") {
                await this.prisma.plane.update({
                    where: { id: updatedFlight.planeId },
                    data: { status: "EN_VUELO" },
                });
            }
        }

        return updatedFlight;
    }
}
