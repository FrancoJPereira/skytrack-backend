import { FlightsService } from "./flights.service";

describe("FlightsService - Unit Test filtro", () => {
  it("filtrar por status devuelve solo los que coinciden y excluye deletedAt", async () => {
    const mockPrisma: any = {
      flight: {
        findMany: jest.fn().mockResolvedValue([
          { id: 1, status: "EN_VUELO", deletedAt: null },
        ]),
      },
    };

    const service = new FlightsService(mockPrisma);

    const result = await service.findAll({ status: "EN_VUELO" });

    // Resultado
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("EN_VUELO");

    // Validar que armó el where correctamente:
    expect(mockPrisma.flight.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deletedAt: null,
          status: "EN_VUELO",
        }),
      })
    );
  });

  it("filtrar por origin excluye otros aeropuertos y mantiene deletedAt null", async () => {
    const mockPrisma: any = {
      flight: {
        findMany: jest.fn().mockResolvedValue([
          { id: 2, origin: "Mendoza", deletedAt: null },
        ]),
      },
    };

    const service = new FlightsService(mockPrisma);

    const result = await service.findAll({ origin: "Mendoza" });

    expect(result).toHaveLength(1);
    expect(result[0].origin).toBe("Mendoza");

    expect(mockPrisma.flight.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deletedAt: null,
          origin: "Mendoza",
        }),
      })
    );
  });
});
