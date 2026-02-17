import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { FlightsService } from "./flights.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CreateFlightDto } from "./dto/create-flight.dto";



@Controller("flights")
export class FlightsController {
    constructor(private flights: FlightsService) { }
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles("ADMIN")
    create(@Body() body: CreateFlightDto) {
        return this.flights.create(body);
    }


    @Get()
    findAll(
        @Query("origin") origin?: string,
        @Query("destination") destination?: string,
        @Query("status") status?: string,

    ) {
        return this.flights.findAll({ origin, destination, status });
    }


    @Delete(":id")
    softDelete(@Param("id") id: string) {
        return this.flights.softDelete(Number(id));
    }
}
