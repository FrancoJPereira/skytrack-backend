import { Controller, Get } from "@nestjs/common";
import { FlightsService } from "./flights.service";

@Controller("flights")
export class FlightsController {
    constructor(private flights: FlightsService) { }

    @Get()
    findAll() {
        return this.flights.findAll();
    }
}
