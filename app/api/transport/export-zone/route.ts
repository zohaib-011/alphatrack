// import { NextRequest, NextResponse } from 'next/server';
// import * as XLSX from 'xlsx';

// interface Station {
//   station_id: number;
//   station_name: string;
//   student_count: number;
// }

// interface Route {
//   route_id: number | null;
//   route_name: string;
//   total_students: number;
//   total_stations: number;
//   stations: Station[];
// }

// interface Zone {
//   zone_id: number;
//   zone_name: string;
//   total_students: number;
//   total_stations: number;
//   total_routes: number;
//   routes: Route[];
// }

// interface ZoneResponse {
//   status: string;
//   data: Zone;
// }

// function zoneToRows(zone: Zone): any[][] {
//   const rows: any[][] = [];
  
//   // Zone header
//   rows.push([`Zone Report: ${zone.zone_name}`]);
//   rows.push(['Zone ID', zone.zone_id]);
//   rows.push(['Total Students', zone.total_students]);
//   rows.push(['Total Stations', zone.total_stations]);
//   rows.push(['Total Routes', zone.total_routes]);
//   rows.push([]);
  
//   // Process each route
//   zone.routes.forEach((route, routeIndex) => {
//     rows.push([`Route ${routeIndex + 1}: ${route.route_name}`]);
//     rows.push(['Route ID', route.route_id || 'N/A']);
//     rows.push(['Total Students', route.total_students]);
//     rows.push(['Total Stations', route.total_stations]);
//     rows.push([]);
    
//     if (route.stations && route.stations.length > 0) {
//       rows.push(['Stops']);
//       rows.push(['#', 'Station ID', 'Station Name', 'Student Count']);
      
//       route.stations.forEach((station, idx) => {
//         rows.push([
//           idx + 1,
//           station.station_id,
//           station.station_name,
//           station.student_count
//         ]);
//       });
//     } else {
//       rows.push(['No stations assigned to this route']);
//     }
    
//     rows.push([]);
//     rows.push([]);
//   });
  
//   return rows;
// }

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();
//     const zone = body.data;

//     if (!zone) {
//       return NextResponse.json({ error: 'Zone data is required' }, { status: 400 });
//     }

//     // Build worksheet rows
//     const wsData: any[][] = [];
//     wsData.push(...zoneToRows(zone));

//     // Create workbook and worksheet
//     const wb = XLSX.utils.book_new();
//     const ws = XLSX.utils.aoa_to_sheet(wsData);
//     XLSX.utils.book_append_sheet(wb, ws, 'Zone Report');

//     // Write buffer
//     const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

//     // Filename
//     const filename = `zone_${zone.zone_name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.xlsx`;

//     // Ensure proper download headers
//     const headers = new Headers();
//     headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//     headers.set('Content-Disposition', `attachment; filename="${filename}"`);
//     headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
//     headers.set('Pragma', 'no-cache');
//     headers.set('Expires', '0');

//     return new NextResponse(buf, {
//       status: 200,
//       headers,
//     });
//   } catch (error) {
//     console.error('Excel generation error:', error);
//     return NextResponse.json(
//       { error: 'Failed to generate Excel report' },
//       { status: 500 }
//     );
//   }
// }
