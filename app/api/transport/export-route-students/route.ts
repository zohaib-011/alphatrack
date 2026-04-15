import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

interface Student {
  RouteName: number;
  StationId: number;
  StationName: string;
  Roll_No: string;
}

interface Stop {
  name: string;
  lat: string;
  lng: string;
  station_id: number;
  student_count: number;
  students: Student[];
}

interface RouteWithStudents {
  id: number;
  code: string;
  name: string;
  description: string;
  stops: Stop[];
  total_students: number;
  startTime: string;
  endTime: string | null;
  assignedBus: string;
  assignedDriver: string;
  driverId: number;
  vehicleId: number;
  timeSlotId: number;
  status: string;
  frequency: string | null;
  distance: string | null;
}

interface RouteStudentsResponse {
  status: string;
  data: RouteWithStudents;
}

function routeStudentsToRows(route: RouteWithStudents): any[][] {
  const rows: any[][] = [];
  
  // Route header
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
  rows.push(['Total Students', route.total_students]);
  rows.push(['Frequency', route.frequency || 'N/A']);
  rows.push(['Distance', route.distance || 'N/A']);
  rows.push([]);
  
  // Process each stop with students
  route.stops.forEach((stop) => {
    rows.push([`Stop: ${stop.name}`]);
    rows.push(['Station ID', stop.station_id]);
    rows.push(['Student Count', stop.student_count]);
    rows.push(['Latitude', stop.lat]);
    rows.push(['Longitude', stop.lng]);
    rows.push([]);
    
    if (stop.students && stop.students.length > 0) {
      rows.push(['Students at this stop']);
      rows.push(['S.No', 'Roll Number', 'Route Name', 'Station Name']);
      
      stop.students.forEach((student, idx) => {
        rows.push([
          idx + 1,
          student.Roll_No,
          student.RouteName,
          student.StationName
        ]);
      });
    } else {
      rows.push(['No students assigned to this stop']);
    }
    
    rows.push([]);
    rows.push([]);
  });
  
  return rows;
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const routeId = url.searchParams.get('routeId');
    
    if (!routeId) {
      return NextResponse.json(
        { error: 'routeId parameter is required' },
        { status: 400 }
      );
    }

    // Fetch route with students data from the external API
    const apiUrl = process.env.API_BASE_URL || 'http://localhost/code/public/api';
    const routeResponse = await fetch(`${apiUrl}/routes-with-students/${routeId}`);
    
    if (!routeResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch route students data' },
        { status: 500 }
      );
    }

    const routeData: RouteStudentsResponse = await routeResponse.json();
    const route = routeData.data;

    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    // Build worksheet rows
    const wsData: any[][] = [];
    wsData.push(...routeStudentsToRows(route));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Route Students Report');

    // Write buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Filename
    const filename = `route_${route.code}_students_${Date.now()}.xlsx`;

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
    const route = body.data;

    if (!route) {
      return NextResponse.json({ error: 'Route data is required' }, { status: 400 });
    }

    // Build worksheet rows
    const wsData: any[][] = [];
    wsData.push(...routeStudentsToRows(route));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Route Students Report');

    // Write buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Filename
    const filename = `route_${route.code}_students_${Date.now()}.xlsx`;

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
