export class CreatePlaneDto {
    model!: string;
    registration!: string;
    status?: string; // DISPONIBLE | EN_VUELO | MANTENIMIENTO
}
