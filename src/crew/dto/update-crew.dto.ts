import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateCrewDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    fullName?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    role?: string;
}
