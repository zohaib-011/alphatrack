import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

interface Stop {
  name: string;
  lat: string;
  lng: string;
  station_id: number;
}

interface Route {
  id: number;
  code: string;
  name: string;
  description: string;
  stops: Stop[];
  startTime: string;
  endTime: string | null;
  assignedBus: string;
  assignedDriver: string;
  driverId: number | null;
  vehicleId: number;
  timeSlotId: number;
  status: string;
  frequency: string | null;
  distance: string | null;
}

interface RoutesResponse {
  status: string;
  data: Route[];
}

function routeToRows(route: Route, baseRow: number = 0): any[][] {
  const rows: any[][] = [];
  rows.push([`Route ${route.code} – ${route.name}`]);
  rows.push(['ID', route.id]);
  rows.push(['Description', route.description]);
  rows.push(['Start Time', route.startTime]);
  rows.push(['End Time', route.endTime || 'N/A']);
  rows.push(['Status', route.status]);
  rows.push(['Assigned Bus', route.assignedBus]);
  rows.push(['Assigned Driver', route.assignedDriver]);
  rows.push(['Vehicle ID', route.vehicleId]);
  rows.push(['Time Slot ID', route.timeSlotId]);
  rows.push(['Frequency', route.frequency || 'N/A']);
  rows.push(['Distance', route.distance || 'N/A']);
  rows.push([]);
  rows.push(['Stops']);
  rows.push(['#', 'Stop Name', 'Latitude', 'Longitude', 'Station ID']);
  route.stops.forEach((stop, idx) => {
    rows.push([idx + 1, stop.name, stop.lat, stop.lng, stop.station_id]);
  });
  rows.push([]);
  rows.push([]);
  return rows;
}

export async function GET(request: NextRequest) {
  try {
    // Fetch routes data from the external API
    const apiUrl = process.env.API_BASE_URL || 'http://localhost/code/public/api';
    const routesResponse = await fetch(`${apiUrl}/routes`);
    
    if (!routesResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch routes data' },
        { status: 500 }
      );
    }

    const routesData: RoutesResponse = await routesResponse.json();
    const routes = routesData.data || [];

    if (!routes.length) {
      return NextResponse.json({ error: 'No routes found' }, { status: 404 });
    }

    // Build worksheet rows
    const wsData: any[][] = [];
    routes.forEach((route) => {
      wsData.push(...routeToRows(route));
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Routes Report');

    // Write buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Filename
    const filename = `all_routes_${Date.now()}.xlsx`;

    // Ensure proper download headers
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    return new NextResponse(buf, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Excel generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate Excel report' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const routes = body.data || [];

    // If single routeId is provided, filter routes
    let routesToExport = routes;
    if (body.routeId && typeof body.routeId === 'number') {
      const single = routes.find((r: Route) => r.id === body.routeId);
      if (!single) {
        return NextResponse.json({ error: 'Route not found' }, { status: 404 });
      }
      routesToExport = [single];
    }

    if (!routesToExport.length) {
      return NextResponse.json({ error: 'No routes to export' }, { status: 400 });
    }

    // Build worksheet rows
    const wsData: any[][] = [];
    routesToExport.forEach((route: Route) => {
      wsData.push(...routeToRows(route));
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Routes Report');

    // Write buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Filename
    const isSingle = routesToExport.length === 1;
    const filename = isSingle
      ? `route_${routesToExport[0].code}_${Date.now()}.xlsx`
      : `all_routes_${Date.now()}.xlsx`;

    // Ensure proper download headers
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    return new NextResponse(buf, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Excel generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate Excel report' },
      { status: 500 }
    );
  }
}
