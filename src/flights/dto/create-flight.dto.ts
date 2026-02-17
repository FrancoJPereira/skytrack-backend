import { IsEnum, IsISO8601, IsNotEmpty, IsOptional, IsString, Matches, IsInt, Min } from "class-validator";

export class CreateFlightDto {
    @IsString()
    @IsNotEmpty()
    @Matches(/^SK\d+$/, { message: "code debe ser tipo SK300" })
    code: string;

    @IsString()
    @IsNotEmpty()
    origin: string;

    @IsString()
    @IsNotEmpty()
    destination: string;

    @IsISO8601()
    departureTime: string;

    @IsISO8601()
    arrivalTime: string;

    @IsOptional()
    @IsEnum(["PROGRAMADO", "EN_VUELO", "CANCELADO"])
    status?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    planeId?: number;
}
