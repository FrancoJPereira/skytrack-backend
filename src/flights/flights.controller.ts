import { Controller, Delete, Get, Param } from "@nestjs/common";
import { FlightsService } from "./flights.service";

@Controller("flights")
export class FlightsController {
    constructor(private flights: FlightsService) { }

    @Get()
    findAll() {
        return this.flights.findAll();
    }

    @Delete(":id")
    softDelete(@Param("id") id: string) {
        return this.flights.softDelete(Number(id));
    }
}
