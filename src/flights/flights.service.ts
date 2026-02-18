import {
    BadRequestException,
    ConflictException,
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

            if (!plane) throw new NotFoundException("El avión no existe");
            if (plane.status !== "DISPONIBLE")
                throw new ConflictException("El avión no está DISPONIBLE");
        }

        const flight = await this.prisma.flight.create({
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

        // Consistencia: si creás EN_VUELO con avión, avión pasa a EN_VUELO
        if (dto.status === "EN_VUELO" && flight.planeId) {
            await this.prisma.plane.update({
                where: { id: flight.planeId },
                data: { status: "EN_VUELO" },
            });
        }

        return flight;
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
        const existing = await this.prisma.flight.findUnique({ where: { id } });

        if (!existing) throw new NotFoundException("El vuelo no existe");
        if (existing.deletedAt)
            throw new NotFoundException("El vuelo no existe o fue eliminado");

        // Regla A: No permitir updates si está CANCELADO o ATERRIZADO
        if (existing.status === "CANCELADO" || existing.status === "ATERRIZADO") {
            throw new BadRequestException(
                "No se puede modificar un vuelo CANCELADO o ATERRIZADO"
            );
        }

        // Validación si se quiere setear/cambiar planeId
        if (dto.planeId !== undefined && dto.planeId !== null) {
            const plane = await this.prisma.plane.findUnique({
                where: { id: dto.planeId },
            });

            if (!plane) throw new NotFoundException("El avión no existe");
            if (plane.status !== "DISPONIBLE")
                throw new ConflictException("El avión no está DISPONIBLE");

            // Regla A extra: evitar asignar un avión ya usado por otro vuelo EN_VUELO
            const alreadyInUse = await this.prisma.flight.findFirst({
                where: {
                    deletedAt: null,
                    status: "EN_VUELO",
                    planeId: dto.planeId,
                    id: { not: id },
                },
            });
            if (alreadyInUse)
                throw new ConflictException("El avión ya está asignado a un vuelo EN_VUELO");
        }

        const updated = await this.prisma.flight.update({
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

        // Consistencia: si queda EN_VUELO con avión, avión pasa a EN_VUELO
        if (dto.status === "EN_VUELO" && updated.planeId) {
            await this.prisma.plane.update({
                where: { id: updated.planeId },
                data: { status: "EN_VUELO" },
            });
        }

        return updated;
    }

    async softDelete(id: number) {
        const flight = await this.prisma.flight.findUnique({ where: { id } });

        if (!flight) throw new NotFoundException("Vuelo no encontrado");
        if (flight.deletedAt)
            throw new NotFoundException("El vuelo no existe o fue eliminado");

        // Regla A: no borrar si está EN_VUELO o ATERRIZADO
        if (flight.status === "EN_VUELO" || flight.status === "ATERRIZADO") {
            throw new BadRequestException(
                "No se puede eliminar un vuelo EN_VUELO o ATERRIZADO"
            );
        }

        // Si tenía avión asignado, liberarlo
        if (flight.planeId) {
            await this.prisma.plane.update({
                where: { id: flight.planeId },
                data: { status: "DISPONIBLE" },
            });
        }

        return this.prisma.flight.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    async addCrewMember(flightId: number, crewMemberId: number) {
        const flight = await this.prisma.flight.findUnique({ where: { id: flightId } });
        if (!flight || flight.deletedAt) {
            throw new NotFoundException("El vuelo no existe o fue eliminado");
        }

        const crew = await this.prisma.crewMember.findUnique({ where: { id: crewMemberId } });
        if (!crew) {
            throw new NotFoundException("El tripulante no existe");
        }

        // Evitar duplicados (por @@unique([flightId, crewMemberId]))
        const exists = await this.prisma.flightCrew.findFirst({
            where: { flightId, crewMemberId },
        });

        if (exists) {
            throw new BadRequestException("El tripulante ya está asignado a ese vuelo");
        }

        return this.prisma.flightCrew.create({
            data: { flightId, crewMemberId },
            include: { crewMember: true },
        });
    }

    async removeCrewMember(flightId: number, crewMemberId: number) {
        const flight = await this.prisma.flight.findUnique({ where: { id: flightId } });
        if (!flight || flight.deletedAt) {
            throw new NotFoundException("El vuelo no existe o fue eliminado");
        }

        const exists = await this.prisma.flightCrew.findFirst({
            where: { flightId, crewMemberId },
        });

        if (!exists) {
            throw new NotFoundException("Ese tripulante no está asignado a ese vuelo");
        }

        return this.prisma.flightCrew.delete({
            where: { id: exists.id },
        });
    }

    async getCrewForFlight(flightId: number) {
        const flight = await this.prisma.flight.findUnique({ where: { id: flightId } });
        if (!flight || flight.deletedAt) {
            throw new NotFoundException("El vuelo no existe o fue eliminado");
        }

        return this.prisma.flightCrew.findMany({
            where: { flightId },
            include: { crewMember: true },
            orderBy: { id: "asc" },
        });
    }

}
