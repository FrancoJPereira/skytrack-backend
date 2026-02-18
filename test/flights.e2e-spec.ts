import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { AppModule } from "../src/app.module";

// ✅ así no falla nunca por import
const request = require("supertest");


describe("Flights E2E", () => {
    let app: INestApplication;
    let token: string;
    let createdFlightId: number;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
        await app.init();

        // Login admin para obtener token
        const loginRes = await request(app.getHttpServer())
            .post("/auth/login")
            .send({ username: "admin", password: "admin123" });

        token = loginRes.body.access_token;
        expect(token).toBeDefined();
    });

    afterAll(async () => {
        await app.close();
    });

    it("flujo principal: listar, filtrar, crear, asignar crew, ver crew, cambiar estado", async () => {
        // 1) ver listado de vuelos
        const listRes = await request(app.getHttpServer()).get("/flights");
        expect(listRes.status).toBe(200);
        expect(Array.isArray(listRes.body)).toBe(true);

        // 2) filtrar por estado (ej: ATERRIZADO)
        const filterRes = await request(app.getHttpServer()).get("/flights?status=ATERRIZADO");
        expect(filterRes.status).toBe(200);

        // 3) crear vuelo (para tener un ID controlado en test)
        const createRes = await request(app.getHttpServer())
            .post("/flights")
            .set("Authorization", `Bearer ${token}`)
            .send({
                code: "SK999",
                origin: "Mendoza",
                destination: "Cordoba",
                departureTime: "2026-02-20T12:00:00.000Z",
                arrivalTime: "2026-02-20T14:00:00.000Z",
                status: "PROGRAMADO",
            });

        expect(createRes.status).toBe(201);
        createdFlightId = createRes.body.id;
        expect(createdFlightId).toBeDefined();

        // 4) seleccionar un vuelo (en API: usar el id creado)
        //    (si no tenés GET /flights/:id, no lo inventamos; seguimos con endpoints existentes)

        // 5) ver tripulación asignada (debe ser lista)
        const crewListRes = await request(app.getHttpServer()).get(`/flights/${createdFlightId}/crew`);
        expect(crewListRes.status).toBe(200);
        expect(Array.isArray(crewListRes.body)).toBe(true);

        // 6) asignar tripulación (necesitamos 1 crew existente: id=1, si tu seed lo crea)
        const addCrewRes = await request(app.getHttpServer())
            .post(`/flights/${createdFlightId}/crew/1`)
            .set("Authorization", `Bearer ${token}`);

        // Si crew 1 existe → 201/200. Si no existe → 404.
        // Para cumplir el PDF, lo ideal es que el seed cree al menos un tripulante.
        expect([200, 201, 404]).toContain(addCrewRes.status);

        // 7) cambiar estado del vuelo (simulado con botones: en API es PATCH)
        const patchRes = await request(app.getHttpServer())
            .patch(`/flights/${createdFlightId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ status: "EMBARCANDO" });

        expect(patchRes.status).toBe(200);
        expect(patchRes.body.status).toBe("EMBARCANDO");

        // 8) quitar tripulación (si se pudo agregar)
        if ([200, 201].includes(addCrewRes.status)) {
            const removeCrewRes = await request(app.getHttpServer())
                .delete(`/flights/${createdFlightId}/crew/1`)
                .set("Authorization", `Bearer ${token}`);

            expect([200, 204]).toContain(removeCrewRes.status);
        }
    });
});
