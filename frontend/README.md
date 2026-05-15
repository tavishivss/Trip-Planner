# ELD Trip Planner Frontend

React/Vite frontend for the ELD Trip Planner. It collects trip inputs, calls the Django API, renders the route map, and displays downloadable daily log sheets.

## Main Features

- Trip form for current location, pickup location, drop-off location, and current cycle hours
- Location autocomplete backed by the backend geocode endpoint
- Leaflet map with route lines and planned duty events
- Trip summary with driving, on-duty, off-duty, fuel, break, and restart totals
- Canvas-rendered daily log sheets with PDF download

## Local Development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

The frontend runs at `http://localhost:5173`.

## API Configuration

In development, API requests default to `http://localhost:8000`.

In production, API requests default to `/_/backend`, matching the Vercel backend route prefix.

To override the API URL, set:

```bash
VITE_API_BASE_URL=<backend-url>
```

## Useful Commands

```bash
npm run lint
npm run build
```
