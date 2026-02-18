import { IsEnum, IsISO8601, IsInt, IsOptional, IsString, Matches, Min, IsNotEmpty } from "class-validator";
import { Type } from "class-transformer";


export class UpdateFlightDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @Matches(/^SK\d+$/, { message: "code debe ser tipo SK300" })
    code?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    origin?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    destination?: string;

    @IsOptional()
    @IsISO8601()
    departureTime?: string;

    @IsOptional()
    @IsISO8601()
    arrivalTime?: string;

    @IsOptional()
    @IsEnum(["PROGRAMADO", "EMBARCANDO", "EN_VUELO", "ATERRIZADO", "CANCELADO"], {
        message: "status inválido",
    })
    status?: string;


    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    planeId?: number | null;

}
