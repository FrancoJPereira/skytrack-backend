# Pruebas rápidas (SkyTrack Airlines Backend)

## Token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["access_token"])')

## Flights (GET)
curl http://localhost:3000/flights

## Flights (POST) ADMIN
curl -X POST http://localhost:3000/flights \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"code":"SK910","origin":"Mendoza","destination":"Cordoba","departureTime":"2026-02-20T12:00:00.000Z","arrivalTime":"2026-02-20T14:00:00.000Z","status":"PROGRAMADO"}'

## Flights (PATCH) ADMIN
curl -X PATCH http://localhost:3000/flights/ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"EN_VUELO","planeId":1}'

## Crew (GET)
curl http://localhost:3000/crew

## Crew (DELETE soft) ADMIN
curl -X DELETE http://localhost:3000/crew/ID \
  -H "Authorization: Bearer $TOKEN"

## Crew asignación a vuelo (ADMIN)
curl -X POST http://localhost:3000/flights/ID_VUELO/crew/ID_CREW \
  -H "Authorization: Bearer $TOKEN"
