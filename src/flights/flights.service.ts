import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FlightStatus, PlaneStatus } from "@prisma/client";

const FINAL_STATUSES: FlightStatus[] = [
    FlightStatus.ATERRIZADO,
    FlightStatus.CANCELADO,
];

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
            orderBy: { id: "asc" },
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
            if (plane.status !== PlaneStatus.DISPONIBLE) {
                throw new BadRequestException("El avión no está DISPONIBLE");
            }

            // Evitar que el avión esté asignado a otro vuelo ACTIVO
            const otherActive = await this.prisma.flight.findFirst({
                where: {
                    planeId: dto.planeId,
                    deletedAt: null,
                    status: { notIn: FINAL_STATUSES },
                },
                select: { id: true },
            });
            if (otherActive) {
                throw new BadRequestException(
                    `El avión ya está asignado al vuelo ${otherActive.id}`,
                );
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

        // Consistencia: si lo crean EN_VUELO y tiene avión, el avión pasa a EN_VUELO
        if (created.status === FlightStatus.EN_VUELO && created.planeId) {
            await this.prisma.plane.update({
                where: { id: created.planeId },
                data: { status: PlaneStatus.EN_VUELO },
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
        },
    ) {
        const existing = await this.prisma.flight.findUnique({ where: { id } });
        if (!existing || existing.deletedAt) {
            throw new NotFoundException("El vuelo no existe o fue eliminado");
        }

        const previousPlaneId = existing.planeId;

        // Bloqueo si ya está finalizado
        if (FINAL_STATUSES.includes(existing.status)) {
            if (dto.status && dto.status !== existing.status) {
                throw new BadRequestException(
                    "El vuelo está finalizado y no puede cambiar de estado",
                );
            }
            if (dto.planeId !== undefined) {
                throw new BadRequestException(
                    "El vuelo está finalizado y no puede cambiar de avión",
                );
            }
        }

        const newStatus = (dto.status as FlightStatus | undefined) ?? existing.status;

        // Resultado final de avión (considerando si mandó planeId o no)
        const resultingPlaneId =
            dto.planeId !== undefined ? dto.planeId : existing.planeId;

        // Regla: no se puede EN_VUELO sin avión
        if (newStatus === FlightStatus.EN_VUELO && !resultingPlaneId) {
            throw new BadRequestException(
                "No se puede poner EN_VUELO un vuelo sin avión asignado",
            );
        }

        // VALIDACIÓN DE AVIÓN (solo si está cambiando a otro avión)
        const isChangingPlane =
            dto.planeId !== undefined && dto.planeId !== previousPlaneId;

        if (isChangingPlane) {
            // Si planeId viene null => está desasignando, permitido solo si NO queda EN_VUELO
            if (dto.planeId === null) {
                if (newStatus === FlightStatus.EN_VUELO) {
                    throw new BadRequestException(
                        "No se puede quitar el avión si el vuelo queda EN_VUELO",
                    );
                }
            } else {
                // planeId nuevo
                const plane = await this.prisma.plane.findUnique({
                    where: { id: dto.planeId },
                });
                if (!plane) throw new BadRequestException("El avión no existe");
                if (plane.status !== PlaneStatus.DISPONIBLE) {
                    throw new BadRequestException("El avión no está DISPONIBLE");
                }

                // Evitar avión asignado a otro vuelo activo
                const otherActive = await this.prisma.flight.findFirst({
                    where: {
                        planeId: dto.planeId,
                        deletedAt: null,
                        status: { notIn: FINAL_STATUSES },
                        id: { not: id },
                    },
                    select: { id: true },
                });
                if (otherActive) {
                    throw new BadRequestException(
                        `El avión ya está asignado al vuelo ${otherActive.id}`,
                    );
                }
            }
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

        // --- Consistencia de avión ---
        // 1) Si cambió el avión y había uno anterior, liberar el anterior
        if (isChangingPlane && previousPlaneId) {
            await this.prisma.plane.update({
                where: { id: previousPlaneId },
                data: { status: PlaneStatus.DISPONIBLE },
            });
        }

        // 2) Si el vuelo queda EN_VUELO y tiene avión → avión EN_VUELO
        if (updated.status === FlightStatus.EN_VUELO && updated.planeId) {
            await this.prisma.plane.update({
                where: { id: updated.planeId },
                data: { status: PlaneStatus.EN_VUELO },
            });
        }

        // 3) Si el vuelo queda FINAL (ATERRIZADO/CANCELADO) → liberar avión
        if (FINAL_STATUSES.includes(updated.status) && updated.planeId) {
            await this.prisma.plane.update({
                where: { id: updated.planeId },
                data: { status: PlaneStatus.DISPONIBLE },
            });
        }

        return updated;
    }

    async softDelete(id: number) {
        const flight = await this.prisma.flight.findUnique({ where: { id } });
        if (!flight || flight.deletedAt) throw new NotFoundException("Vuelo no encontrado");

        // liberar avión si tenía
        if (flight.planeId) {
            await this.prisma.plane.update({
                where: { id: flight.planeId },
                data: { status: PlaneStatus.DISPONIBLE },
            });
        }

        return this.prisma.flight.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    // --------------------------
    // Tripulación (FlightCrew)
    // --------------------------

    private async assertFlightUsableForCrew(flightId: number) {
        const flight = await this.prisma.flight.findUnique({ where: { id: flightId } });
        if (!flight || flight.deletedAt) {
            throw new NotFoundException("El vuelo no existe o fue eliminado");
        }
        if (FINAL_STATUSES.includes(flight.status)) {
            throw new BadRequestException(
                "No se puede modificar tripulación en un vuelo finalizado",
            );
        }
        return flight;
    }

    async addCrewMember(flightId: number, crewMemberId: number) {
        await this.assertFlightUsableForCrew(flightId);

        const crew = await this.prisma.crewMember.findUnique({ where: { id: crewMemberId } });
        if (!crew || (crew as any).deletedAt) {
            throw new NotFoundException("El tripulante no existe o fue eliminado");
        }

        const exists = await this.prisma.flightCrew.findUnique({
            where: { flightId_crewMemberId: { flightId, crewMemberId } },
        });
        if (exists) throw new BadRequestException("El tripulante ya está asignado a ese vuelo");

        return this.prisma.flightCrew.create({
            data: { flightId, crewMemberId },
            include: { crewMember: true },
        });
    }

    async removeCrewMember(flightId: number, crewMemberId: number) {
        await this.assertFlightUsableForCrew(flightId);

        const exists = await this.prisma.flightCrew.findUnique({
            where: { flightId_crewMemberId: { flightId, crewMemberId } },
        });
        if (!exists) throw new NotFoundException("Ese tripulante no está asignado a ese vuelo");

        return this.prisma.flightCrew.delete({
            where: { flightId_crewMemberId: { flightId, crewMemberId } },
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
