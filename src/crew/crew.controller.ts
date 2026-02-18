import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CrewService } from "./crew.service";
import { CreateCrewDto } from "./dto/create-crew.dto";
import { UpdateCrewDto } from "./dto/update-crew.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";

@Controller("crew")
export class CrewController {
    constructor(private crew: CrewService) { }

    @Get()
    findAll() {
        return this.crew.findAll();
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles("ADMIN")
    create(@Body() body: CreateCrewDto) {
        return this.crew.create(body);
    }

    @Patch(":id")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles("ADMIN")
    update(@Param("id") id: string, @Body() body: UpdateCrewDto) {
        return this.crew.update(Number(id), body);
    }

    @Delete(":id")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles("ADMIN")
    softDelete(@Param("id") id: string) {
        return this.crew.softDelete(Number(id));
    }
}

