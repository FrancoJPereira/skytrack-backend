export class UpdateFlightDto {
    code?: string;
    origin?: string;
    destination?: string;
    departureTime?: string;
    arrivalTime?: string;
    status?: string;
    planeId?: number | null;
}
