import { FlightsService } from "./flights.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CreateFlightDto } from "./dto/create-flight.dto";
import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
    ParseIntPipe,
} from "@nestjs/common";
import { UpdateFlightDto } from "./dto/update-flight.dto";

@Controller("flights")
export class FlightsController {
    constructor(private flights: FlightsService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles("ADMIN")
    create(@Body() body: CreateFlightDto) {
        return this.flights.create(body);
    }

    @Patch(":id")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles("ADMIN")
    update(@Param("id", ParseIntPipe) id: number, @Body() body: UpdateFlightDto) {
        return this.flights.update(id, body);
    }

    @Get()
    findAll(
        @Query("origin") origin?: string,
        @Query("destination") destination?: string,
        @Query("status") status?: string
    ) {
        return this.flights.findAll({ origin, destination, status });
    }

    @Delete(":id")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles("ADMIN")
    softDelete(@Param("id", ParseIntPipe) id: number) {
        return this.flights.softDelete(id);
    }

    @Post(":id/crew/:crewId")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles("ADMIN")
    addCrew(
        @Param("id", ParseIntPipe) id: number,
        @Param("crewId", ParseIntPipe) crewId: number
    ) {
        return this.flights.addCrewMember(id, crewId);
    }

    @Delete(":id/crew/:crewId")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles("ADMIN")
    removeCrew(
        @Param("id", ParseIntPipe) id: number,
        @Param("crewId", ParseIntPipe) crewId: number
    ) {
        return this.flights.removeCrewMember(id, crewId);
    }

    @Get(":id/crew")
    getCrew(@Param("id", ParseIntPipe) id: number) {
        return this.flights.getCrewForFlight(id);
    }
}
