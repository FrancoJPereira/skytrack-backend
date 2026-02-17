import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { Roles } from "./roles.decorator";
import { RolesGuard } from "./roles.guard";

@Controller("auth")
export class AuthController {
    constructor(private auth: AuthService) { }

    @Post("login")
    login(@Body() body: { username: string; password: string }) {
        return this.auth.login(body.username, body.password);
    }

    @Get("profile")
    @UseGuards(JwtAuthGuard)
    profile(@Req() req: any) {
        return req.user;
    }


    @Get("admin-only")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles("ADMIN")
    adminOnly() {
        return { ok: true, message: "Sos ADMIN" };
    }
}
