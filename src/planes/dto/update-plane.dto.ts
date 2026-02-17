import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdatePlaneDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    model?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    registration?: string;

    @IsOptional()
    @IsEnum(["DISPONIBLE", "MANTENIMIENTO", "EN_VUELO"])
    status?: string;
}
