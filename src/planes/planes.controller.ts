import { PlanesService } from "./planes.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CreatePlaneDto } from "./dto/create-plane.dto";
import { UpdatePlaneDto } from "./dto/update-plane.dto";
import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";



@Controller("planes")
export class PlanesController {
    constructor(private planes: PlanesService) { }

    @Get()
    findAll() {
        return this.planes.findAll();
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles("ADMIN")
    create(@Body() body: CreatePlaneDto) {
        return this.planes.create(body);
    }

    @Patch(":id")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles("ADMIN")
    update(@Param("id") id: string, @Body() body: UpdatePlaneDto) {
        return this.planes.update(Number(id), body);
    }

}
