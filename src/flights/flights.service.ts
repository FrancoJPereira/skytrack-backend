import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class FlightsService {
    constructor(private prisma: PrismaService) { }

    findAll() {
        return this.prisma.flight.findMany();
    }
}
