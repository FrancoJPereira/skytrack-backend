import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import bcrypt from "bcrypt";

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService, private jwt: JwtService) { }

    async login(username: string, password: string) {
        const user = await this.prisma.user.findUnique({ where: { username } });
        if (!user) throw new UnauthorizedException("Credenciales inválidas");

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) throw new UnauthorizedException("Credenciales inválidas");

        const payload = { sub: user.id, username: user.username, role: user.role };
        return { access_token: await this.jwt.signAsync(payload) };
    }
}
