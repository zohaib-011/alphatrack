import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

interface Student {
  Roll_No: string;
  RouteName: string;
  StationName: string;
}

interface Station {
  station_id: number;
  station_name: string;
  student_count: number;
  students: Student[];
}

interface RouteData {
  route_name: string;
  total_students: number;
  station_count: number;
  stations: Station[];
}

interface RouteResponse {
  status: string;
  data: RouteData;
}

function routeToRows(route: RouteData): any[][] {
  const rows: any[][] = [];
  
  // Route header
  rows.push([`Route Report: ${route.route_name}`]);
  rows.push(['Route Name', route.route_name]);
  rows.push(['Total Students', route.total_students]);
  rows.push(['Total Stations', route.station_count]);
  rows.push([]);
  
  // Stations summary
  rows.push(['Stops Summary']);
  rows.push(['#', 'Station ID', 'Station Name', 'Student Count']);
  
  route.stations.forEach((station, idx) => {
    rows.push([
      idx + 1,
      station.station_id,
      station.station_name,
      station.student_count
    ]);
  });
  
  rows.push([]);
  rows.push([]);
  
  return rows;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const routeData = body.data;

    if (!routeData) {
      return NextResponse.json({ error: 'Route data is required' }, { status: 400 });
    }

    // Validate required fields
    if (!routeData.route_name || !routeData.stations) {
      return NextResponse.json({ 
        error: 'Missing required fields: route_name and stations' 
      }, { status: 400 });
    }

    // Build worksheet rows
    const wsData: any[][] = [];
    wsData.push(...routeToRows(routeData));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Route Summary');

    // Write buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Filename
    const filename = `route_${routeData.route_name}_summary_${Date.now()}.xlsx`;

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
