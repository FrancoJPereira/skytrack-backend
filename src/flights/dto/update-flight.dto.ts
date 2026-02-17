import { IsEnum, IsISO8601, IsInt, IsOptional, IsString, Matches, Min, IsNotEmpty } from "class-validator";

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
    @IsEnum(["PROGRAMADO", "EN_VUELO", "CANCELADO"])
    status?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    planeId?: number | null;
}
