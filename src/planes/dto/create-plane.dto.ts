import { IsEnum, IsNotEmpty, IsString } from "class-validator";

export class CreatePlaneDto {
    @IsString()
    @IsNotEmpty()
    model: string;

    @IsString()
    @IsNotEmpty()
    registration: string;

    @IsEnum(["DISPONIBLE", "MANTENIMIENTO", "EN_VUELO"])
    status: string;
}
