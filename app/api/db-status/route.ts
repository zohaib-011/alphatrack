// import { NextRequest, NextResponse } from 'next/server';

// interface DatabaseStatus {
//   status: 'healthy' | 'unhealthy' | 'degraded';
//   timestamp: string;
//   connection: {
//     status: 'connected' | 'disconnected' | 'timeout';
//     responseTime?: number;
//     error?: string;
//   };
//   database: {
//     name?: string;
//     version?: string;
//     size?: string;
//   };
//   tables?: {
//     name: string;
//     rowCount: number;
//     status: 'ok' | 'error';
//   }[];
//   metrics?: {
//     activeConnections: number;
//     maxConnections: number;
//     cacheHitRate: number;
//   };
// }

// async function checkDatabaseConnection(): Promise<{
//   status: 'connected' | 'disconnected' | 'timeout';
//   responseTime?: number;
//   error?: string;
// }> {
//   const startTime = Date.now();
  
//   try {
//     // Replace this with your actual database connection check
//     // This is a placeholder that checks the external API
//     const response = await fetch('http://localhost/code/public/api/health', {
//       method: 'GET',
//       signal: AbortSignal.timeout(5000) // 5 second timeout
//     });
    
//     const responseTime = Date.now() - startTime;
    
//     if (response.ok) {
//       return {
//         status: 'connected',
//         responseTime
//       };
//     } else {
//       return {
//         status: 'disconnected',
//         responseTime,
//         error: `HTTP ${response.status}: ${response.statusText}`
//       };
//     }
//   } catch (error) {
//     const responseTime = Date.now() - startTime;
//     return {
//       status: 'timeout',
//       responseTime,
//       error: error instanceof Error ? error.message : 'Unknown error'
//     };
//   }
// }

// async function getDatabaseInfo(): Promise<{
//   name?: string;
//   version?: string;
//   size?: string;
// }> {
//   try {
//     // Replace this with your actual database info query
//     // This is a placeholder that fetches basic info
//     const response = await fetch('http://localhost/code/public/api/db-info');
    
//     if (response.ok) {
//       const data = await response.json();
//       return {
//         name: data.database_name,
//         version: data.version,
//         size: data.size
//       };
//     }
//   } catch (error) {
//     console.error('Failed to get database info:', error);
//   }
  
//   return {};
// }

// async function getTableStatus(): Promise<{
//   name: string;
//   rowCount: number;
//   status: 'ok' | 'error';
// }[]> {
//   try {
//     // Replace this with your actual table status query
//     // This is a placeholder that checks common tables
//     const tables = ['routes', 'stops', 'drivers', 'vehicles', 'time_slots'];
//     const tableStatus = [];
    
//     for (const tableName of tables) {
//       try {
//         const response = await fetch(`http://localhost/code/public/api/table/${tableName}/count`);
        
//         if (response.ok) {
//           const data = await response.json();
//           tableStatus.push({
//             name: tableName,
//             rowCount: data.count || 0,
//             status: 'ok' as const
//           });
//         } else {
//           tableStatus.push({
//             name: tableName,
//             rowCount: 0,
//             status: 'error' as const
//           });
//         }
//       } catch (error) {
//         tableStatus.push({
//           name: tableName,
//           rowCount: 0,
//           status: 'error' as const
//         });
//       }
//     }
    
//     return tableStatus;
//   } catch (error) {
//     console.error('Failed to get table status:', error);
//     return [];
//   }
// }

// async function getDatabaseMetrics(): Promise<{
//   activeConnections: number;
//   maxConnections: number;
//   cacheHitRate: number;
// }> {
//   try {
//     // Replace this with your actual database metrics query
//     const response = await fetch('http://localhost/code/public/api/db-metrics');
    
//     if (response.ok) {
//       const data = await response.json();
//       return {
//         activeConnections: data.active_connections || 0,
//         maxConnections: data.max_connections || 100,
//         cacheHitRate: data.cache_hit_rate || 0
//       };
//     }
//   } catch (error) {
//     console.error('Failed to get database metrics:', error);
//   }
  
//   return {
//     activeConnections: 0,
//     maxConnections: 100,
//     cacheHitRate: 0
//   };
// }

// export async function GET(request: NextRequest) {
//   try {
//     const searchParams = request.nextUrl.searchParams;
//     const includeTables = searchParams.get('includeTables') === 'true';
//     const includeMetrics = searchParams.get('includeMetrics') === 'true';
    
//     // Check database connection
//     const connection = await checkDatabaseConnection();
    
//     // Determine overall status
//     let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    
//     if (connection.status === 'disconnected' || connection.status === 'timeout') {
//       status = 'unhealthy';
//     } else if (connection.responseTime && connection.responseTime > 1000) {
//       status = 'degraded';
//     }
    
//     // Get basic database info
//     const database = await getDatabaseInfo();
    
//     // Build response
//     const dbStatus: DatabaseStatus = {
//       status,
//       timestamp: new Date().toISOString(),
//       connection,
//       database
//     };
    
//     // Include table status if requested
//     if (includeTables) {
//       dbStatus.tables = await getTableStatus();
      
//       // Check if any tables have errors
//       const errorTables = dbStatus.tables.filter(t => t.status === 'error');
//       if (errorTables.length > 0 && status === 'healthy') {
//         status = 'degraded';
//         dbStatus.status = status;
//       }
//     }
    
//     // Include metrics if requested
//     if (includeMetrics) {
//       dbStatus.metrics = await getDatabaseMetrics();
      
//       // Check connection pool usage
//       if (dbStatus.metrics) {
//         const connectionUsage = dbStatus.metrics.activeConnections / dbStatus.metrics.maxConnections;
//         if (connectionUsage > 0.9 && status === 'healthy') {
//           status = 'degraded';
//           dbStatus.status = status;
//         }
//       }
//     }
    
//     return NextResponse.json(dbStatus, {
//       status: status === 'unhealthy' ? 503 : 200,
//       headers: {
//         'Cache-Control': 'no-cache, no-store, must-revalidate',
//         'Pragma': 'no-cache',
//         'Expires': '0'
//       }
//     });
    
//   } catch (error) {
//     console.error('Database status check error:', error);
    
//     const errorStatus: DatabaseStatus = {
//       status: 'unhealthy',
//       timestamp: new Date().toISOString(),
//       connection: {
//         status: 'disconnected',
//         error: error instanceof Error ? error.message : 'Unknown error occurred'
//       },
//       database: {}
//     };
    
//     return NextResponse.json(errorStatus, {
//       status: 503,
//       headers: {
//         'Cache-Control': 'no-cache, no-store, must-revalidate',
//         'Pragma': 'no-cache',
//         'Expires': '0'
//       }
//     });
//   }
// }

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();
//     const { includeTables = false, includeMetrics = false } = body;
    
//     // Build URL with query parameters
//     const url = new URL(request.url);
//     url.searchParams.set('includeTables', includeTables.toString());
//     url.searchParams.set('includeMetrics', includeMetrics.toString());
    
//     // Forward to GET handler with updated parameters
//     const response = await GET(new NextRequest(url.toString(), {
//       method: 'GET',
//       headers: request.headers
//     }));
    
//     return response;
    
//   } catch (error) {
//     console.error('Database status check error:', error);
    
//     const errorStatus: DatabaseStatus = {
//       status: 'unhealthy',
//       timestamp: new Date().toISOString(),
//       connection: {
//         status: 'disconnected',
//         error: error instanceof Error ? error.message : 'Unknown error occurred'
//       },
//       database: {}
//     };
    
//     return NextResponse.json(errorStatus, { status: 503 });
//   }
// }
