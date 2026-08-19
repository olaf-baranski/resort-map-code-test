# Resort Map Code Test

A small full-stack application for viewing a resort map and booking available poolside cabanas.

The application reads the resort layout and current hotel guests from the supplied input files. The backend exposes the map and current cabana availability through a REST API, while the React frontend renders the map using the provided artwork and handles the booking flow.

## Requirements

* Node.js 22.12 or newer
* npm

## Installation

```bash
npm install
```

## Running the application

Start the complete application with:

```bash
npm start
```

`npm start` builds both the frontend and backend automatically and then starts the application.

Open:

```text
http://localhost:3000
```

The production application is served as a single process. Express provides the REST API and serves the built React frontend.

### Custom input files

By default, the application reads:

```text
map.ascii
bookings.json
```

from the current working directory.

Alternative files can be supplied at startup:

```bash
npm start -- --map custom-map.ascii --bookings custom-bookings.json
```

Either option may also be supplied independently:

```bash
npm start -- --map custom-map.ascii
```

```bash
npm start -- --bookings custom-bookings.json
```

The server validates the input files before it starts listening. Invalid or missing input causes startup to fail with a clear error.

## Development

Run the frontend and backend development servers together with:

```bash
npm run dev
```

During development:

* Vite serves the frontend on `http://localhost:5173`
* Express runs on `http://localhost:3000`
* `/api` requests from Vite are proxied to Express

## Verification

Run the automated test suite:

```bash
npm test
```

Run TypeScript checks:

```bash
npm run typecheck
```

Build the production application:

```bash
npm run build
```

The current test suite covers the main behavior across the domain logic, REST API, map rendering, path rendering, and booking UI flow.

## How it works

The application uses three supplied sources:

* `map.ascii` defines the resort layout.
* `bookings.json` contains the current hotel guests used to validate bookings.
* `assets/` contains the artwork used to render the map.

The ASCII map uses:

| Character | Meaning     |
| --------- | ----------- |
| `.`       | Empty space |
| `#`       | Path        |
| `c`       | Chalet      |
| `p`       | Pool        |
| `W`       | Cabana      |

Map dimensions, cabana count, and cabana positions are derived from the supplied map rather than hard-coded.

Path artwork is selected from the provided assets by inspecting the four orthogonal neighbouring path cells. Straight segments, corners, ends, T-junctions, and crossings are therefore rendered according to the actual map layout.

## Booking flow

Selecting an available cabana opens a one-step booking form requesting:

* room number
* guest full name

The backend checks the room number and guest name as a pair against the current guest registry.

After a successful booking:

* the dialog closes;
* a confirmation is displayed;
* the cabana immediately appears unavailable on the map.

Selecting an unavailable cabana instead shows a short unavailable message.

Reservation state is intentionally stored only in server memory, so restarting the server resets all cabanas to available.

## API

### Get resort state

```http
GET /api/map
```

Returns the map layout, dimensions, cabana coordinates, and current availability.

Guest-registry data is not exposed through this endpoint.

### Book a cabana

```http
POST /api/cabanas/:cabanaId/bookings
Content-Type: application/json
```

Example body:

```json
{
  "room": "101",
  "guestName": "Alice Smith"
}
```

Expected responses include:

* `201 Created` - booking succeeded
* `400 Bad Request` - invalid request structure
* `404 Not Found` - unknown cabana
* `409 Conflict` - cabana is already booked
* `422 Unprocessable Entity` - room number and guest name do not match a current guest

## Architecture

The project deliberately uses a small architecture appropriate for the scope of the exercise.

```text
src/
├── client/
│   ├── components/
│   │   ├── BookingDialog.tsx
│   │   └── ResortMap.tsx
│   ├── App.tsx
│   ├── api.ts
│   ├── pathTile.ts
│   └── styles.css
│
└── server/
    ├── app.ts
    ├── cli.ts
    ├── guests.ts
    ├── index.ts
    ├── map.ts
    └── resort.ts
```

Main responsibilities are separated as follows:

* map and guest files are loaded and validated by small backend modules;
* `ResortService` owns the in-memory booking state and booking rules;
* Express translates HTTP requests into domain operations;
* React owns only UI state and communicates with the backend through the REST API;
* map and path rendering remain presentation concerns on the frontend.

No database, authentication system, ORM, state-management framework, or additional application layers are used because they are not required by the exercise.

## Assumptions

Where the task left behavior unspecified, the following assumptions were made:

* Cabana IDs are derived deterministically from their zero-based map coordinates, for example `W_11_3`.
* All cabanas defined by `W` start as available when the server starts.
* Cabana reservation state is kept in memory and resets when the server restarts.
* A guest may reserve more than one cabana because the task does not define a per-guest booking limit.
* Room numbers are compared after trimming surrounding whitespace.
* Guest names are compared after trimming surrounding whitespace and are case-insensitive.
* Guest names are not fuzzy-matched.
* Custom map and bookings paths are interpreted relative to the current working directory when relative paths are supplied.
* Maps must be rectangular and contain only the supported tile characters.
* Path connectivity uses orthogonal neighbours only.

## AI-assisted development

AI coding tools were used during implementation as permitted by the exercise.

The development process, tools, prompts, review approach, and human verification are documented separately in [`AI.md`](AI.md).
