// import { NextRequest, NextResponse } from 'next/server';
// import * as XLSX from 'xlsx';

// interface Vehicle {
//   id: number;
//   plateNumber: string;
//   model: string;
//   capacity: number;
//   year: string;
//   status: string;
//   fuelType: string;
//   fuelConsumptionPerKm: number;
//   assignedRoute: number | null;
//   assignedDriver: string;
//   lastMaintenance: string | null;
//   nextMaintenance: string | null;
//   mileage: string | null;
//   fuelEfficiency: string | null;
//   condition: string;
// }

// interface VehiclesResponse {
//   status: string;
//   data: Vehicle[];
// }

// function vehicleToRows(vehicle: Vehicle): any[][] {
//   const rows: any[][] = [];
//   rows.push([`Vehicle ${vehicle.plateNumber} – ${vehicle.model}`]);
//   rows.push(['ID', vehicle.id]);
//   rows.push(['Plate Number', vehicle.plateNumber]);
//   rows.push(['Model', vehicle.model]);
//   rows.push(['Capacity', vehicle.capacity]);
//   rows.push(['Year', vehicle.year]);
//   rows.push(['Status', vehicle.status]);
//   rows.push(['Fuel Type', vehicle.fuelType]);
//   rows.push(['Fuel Consumption (L/Km)', vehicle.fuelConsumptionPerKm]);
//   rows.push(['Assigned Route', vehicle.assignedRoute || 'N/A']);
//   rows.push(['Assigned Driver', vehicle.assignedDriver]);
//   rows.push(['Last Maintenance', vehicle.lastMaintenance || 'N/A']);
//   rows.push(['Next Maintenance', vehicle.nextMaintenance || 'N/A']);
//   rows.push(['Mileage', vehicle.mileage || 'N/A']);
//   rows.push(['Fuel Efficiency', vehicle.fuelEfficiency || 'N/A']);
//   rows.push(['Condition', vehicle.condition]);
//   rows.push([]);
//   rows.push([]);
//   return rows;
// }

// export async function GET(request: NextRequest) {
//   try {
//     // Fetch vehicles data from the external API
//     const vehiclesResponse = await fetch('http://localhost/code/public/api/vehicles');
    
//     if (!vehiclesResponse.ok) {
//       return NextResponse.json(
//         { error: 'Failed to fetch vehicles data' },
//         { status: 500 }
//       );
//     }

//     const vehiclesData: VehiclesResponse = await vehiclesResponse.json();
//     const vehicles = vehiclesData.data || [];

//     if (!vehicles.length) {
//       return NextResponse.json({ error: 'No vehicles found' }, { status: 404 });
//     }

//     // Build worksheet rows
//     const wsData: any[][] = [];
//     vehicles.forEach((vehicle) => {
//       wsData.push(...vehicleToRows(vehicle));
//     });

//     // Create workbook and worksheet
//     const wb = XLSX.utils.book_new();
//     const ws = XLSX.utils.aoa_to_sheet(wsData);
//     XLSX.utils.book_append_sheet(wb, ws, 'Vehicles Report');

//     // Write buffer
//     const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

//     // Filename
//     const filename = `all_vehicles_${Date.now()}.xlsx`;

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

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();
//     const vehicles = body.data || [];

//     // If single vehicleId is provided, filter vehicles
//     let vehiclesToExport = vehicles;
//     if (body.vehicleId && typeof body.vehicleId === 'number') {
//       const single = vehicles.find((v: Vehicle) => v.id === body.vehicleId);
//       if (!single) {
//         return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
//       }
//       vehiclesToExport = [single];
//     }

//     if (!vehiclesToExport.length) {
//       return NextResponse.json({ error: 'No vehicles to export' }, { status: 400 });
//     }

//     // Build worksheet rows
//     const wsData: any[][] = [];
//     vehiclesToExport.forEach((vehicle: Vehicle) => {
//       wsData.push(...vehicleToRows(vehicle));
//     });

//     // Create workbook and worksheet
//     const wb = XLSX.utils.book_new();
//     const ws = XLSX.utils.aoa_to_sheet(wsData);
//     XLSX.utils.book_append_sheet(wb, ws, 'Vehicles Report');

//     // Write buffer
//     const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

//     // Filename
//     const isSingle = vehiclesToExport.length === 1;
//     const filename = isSingle
//       ? `vehicle_${vehiclesToExport[0].plateNumber}_${Date.now()}.xlsx`
//       : `all_vehicles_${Date.now()}.xlsx`;

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
