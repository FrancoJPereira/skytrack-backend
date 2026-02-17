import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { PlanesService } from "./planes.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CreatePlaneDto } from "./dto/create-plane.dto";

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
}
