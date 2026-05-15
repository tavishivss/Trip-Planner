# ELD Trip Planner

A full-stack application for planning HOS-compliant truck trips with route visualization and automated ELD daily log sheet generation.

## Features

- **Route Planning**: Enter current, pickup, and drop-off locations to get optimized routes
- **HOS Compliance**: Automatic scheduling of rest breaks, off-duty periods, and fuel stops per FMCSA regulations
- **Interactive Map**: Visual route display with color-coded stops using Leaflet/OpenStreetMap
- **ELD Daily Logs**: Canvas-drawn daily log sheets matching FMCSA graph grid format
- **Location Autocomplete**: Search and select locations with Nominatim geocoding

## HOS Rules Implemented

- 11-Hour Driving Limit per shift
- 14-Hour Driving Window
- 30-Minute Rest Break after 8 hours of driving
- 70-Hour/8-Day On-Duty Cycle Limit
- 10 consecutive hours off-duty between shifts
- Fueling stops every 1,000 miles
- 1 hour for pickup and drop-off operations

## Tech Stack

- **Backend**: Django + Django REST Framework
- **Frontend**: React (Vite) + Leaflet
- **Maps**: OpenStreetMap tiles + OSRM routing (free, no API key)
- **Geocoding**: Nominatim (OpenStreetMap)

## Setup & Run

### Backend (Django)

```bash
cd backend
pip install django djangorestframework django-cors-headers requests
python manage.py migrate
python manage.py runserver 8000
```

### Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

## API Endpoints

- `POST /api/plan-trip/` - Plan a trip with HOS compliance
- `GET /api/geocode/?q=<query>` - Search for locations
