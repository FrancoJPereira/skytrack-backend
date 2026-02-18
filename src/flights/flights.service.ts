import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
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
        const flight = await this.prisma.flight.findUnique({ where: { id } });
        if (!flight) throw new NotFoundException("Vuelo no encontrado");

        // Si tenía avión asignado, lo liberamos
        if (flight.planeId) {
            await this.prisma.plane.update({
                where: { id: flight.planeId },
                data: { status: "DISPONIBLE" as any },
            });
        }

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

            if (!plane) throw new BadRequestException("El avión no existe");
            if (plane.status !== "DISPONIBLE")
                throw new BadRequestException("El avión no está DISPONIBLE");
        }

        const created = await this.prisma.flight.create({
            data: {
                code: dto.code,
                origin: dto.origin,
                destination: dto.destination,
                departureTime: new Date(dto.departureTime),
                arrivalTime: new Date(dto.arrivalTime),
                status: (dto.status as any) ?? "PROGRAMADO",
                planeId: dto.planeId ?? null,
            },
        });

        // Si el vuelo nace EN_VUELO con avión, avión pasa a EN_VUELO
        if (created.planeId && created.status === "EN_VUELO") {
            await this.prisma.plane.update({
                where: { id: created.planeId },
                data: { status: "EN_VUELO" as any },
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
        const existingFlight = await this.prisma.flight.findUnique({ where: { id } });
        if (!existingFlight || existingFlight.deletedAt) {
            throw new NotFoundException("El vuelo no existe o fue eliminado");
        }

        const previousPlaneId = existingFlight.planeId;

        // Validar avión si se quiere asignar/cambiar (si planeId viene y no es null)
        if (dto.planeId !== undefined && dto.planeId !== null) {
            const plane = await this.prisma.plane.findUnique({
                where: { id: dto.planeId },
            });

            if (!plane) throw new BadRequestException("El avión no existe");
            if (plane.status !== "DISPONIBLE")
                throw new BadRequestException("El avión no está DISPONIBLE");
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

        // ✅ PASO 20: si cambió el avión o se desasignó, liberar el anterior
        if (dto.planeId === null && previousPlaneId) {
            await this.prisma.plane.update({
                where: { id: previousPlaneId },
                data: { status: "DISPONIBLE" as any },
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
                data: { status: "DISPONIBLE" as any },
            });
        }

        // Estado del avión nuevo según estado final del vuelo
        if (updatedFlight.planeId && updatedFlight.status === "EN_VUELO") {
            await this.prisma.plane.update({
                where: { id: updatedFlight.planeId },
                data: { status: "EN_VUELO" as any },
            });
        }

        return updatedFlight;
    }
}
