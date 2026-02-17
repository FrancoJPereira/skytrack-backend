import "dotenv/config";
import { PrismaClient, PlaneStatus, FlightStatus, UserRole } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
    // Usuarios
    const adminPass = await bcrypt.hash("admin123", 10);
    const opPass = await bcrypt.hash("operador123", 10);

    await prisma.user.upsert({
        where: { username: "admin" },
        update: {},
        create: { username: "admin", password: adminPass, role: UserRole.ADMIN },
    });

    await prisma.user.upsert({
        where: { username: "operador" },
        update: {},
        create: { username: "operador", password: opPass, role: UserRole.OPERADOR },
    });

    // Aviones
    const plane1 = await prisma.plane.upsert({
        where: { registration: "LV-SKY1" },
        update: {},
        create: { model: "Boeing 737", registration: "LV-SKY1", status: PlaneStatus.DISPONIBLE },
    });

    await prisma.plane.upsert({
        where: { registration: "LV-SKY2" },
        update: {},
        create: { model: "Airbus A320", registration: "LV-SKY2", status: PlaneStatus.MANTENIMIENTO },
    });

    // Tripulación
    const piloto = await prisma.crewMember.create({
        data: { fullName: "Juan Pérez", role: "Piloto" },
    });

    const copiloto = await prisma.crewMember.create({
        data: { fullName: "María Gómez", role: "Copiloto" },
    });

    const azafata = await prisma.crewMember.create({
        data: { fullName: "Lucía Fernández", role: "Azafata" },
    });

    // Vuelos (fechas relativas)
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 60 * 1000);
    const in150 = new Date(now.getTime() + 150 * 60 * 1000);

    const ago20 = new Date(now.getTime() - 20 * 60 * 1000);
    const in40 = new Date(now.getTime() + 40 * 60 * 1000);

    const flightNext = await prisma.flight.upsert({
        where: { code: "SK100" },
        update: {},
        create: {
            code: "SK100",
            origin: "Mendoza",
            destination: "Buenos Aires",
            departureTime: in30,
            arrivalTime: in150,
            status: FlightStatus.EMBARCANDO,
            planeId: plane1.id,
        },
    });

    const flightInAir = await prisma.flight.upsert({
        where: { code: "SK200" },
        update: {},
        create: {
            code: "SK200",
            origin: "Santiago",
            destination: "Mendoza",
            departureTime: ago20,
            arrivalTime: in40,
            status: FlightStatus.EN_VUELO,
            planeId: plane1.id,
        },
    });

    // Asignar tripulación al vuelo SK200
    await prisma.flightCrew.createMany({
        data: [
            { flightId: flightInAir.id, crewMemberId: piloto.id },
            { flightId: flightInAir.id, crewMemberId: copiloto.id },
            { flightId: flightInAir.id, crewMemberId: azafata.id },
        ],
        skipDuplicates: true,
    });

    console.log("Seed listo:");
    console.log("- admin / admin123");
    console.log("- operador / operador123");
    console.log("- vuelos: SK100 (embarque), SK200 (en vuelo)");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
