import { IsNotEmpty, IsString } from "class-validator";

export class CreateCrewDto {
    @IsString()
    @IsNotEmpty()
    fullName: string;

    @IsString()
    @IsNotEmpty()
    role: string;
}
