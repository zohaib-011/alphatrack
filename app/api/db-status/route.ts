import { NextRequest, NextResponse } from 'next/server';

interface DatabaseStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  connection: {
    status: 'connected' | 'disconnected' | 'timeout';
    responseTime?: number;
    error?: string;
  };
  database: {
    name?: string;
    version?: string;
    size?: string;
  };
  tables?: {
    name: string;
    rowCount: number;
    status: 'ok' | 'error';
  }[];
  metrics?: {
    activeConnections: number;
    maxConnections: number;
    cacheHitRate: number;
  };
}

async function checkDatabaseConnection(): Promise<{
  status: 'connected' | 'disconnected' | 'timeout';
  responseTime?: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    // Simple health check - can be customized based on your database setup
    const response = await fetch(process.env.DATABASE_URL || 'http://localhost:3000/api/health', {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      return {
        status: 'connected',
        responseTime
      };
    } else {
      return {
        status: 'disconnected',
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      status: 'timeout',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function getDatabaseInfo(): Promise<{
  name?: string;
  version?: string;
  size?: string;
}> {
  try {
    // Placeholder for database info - customize based on your setup
    return {
      name: 'AlphaTrack Database',
      version: '1.0.0',
      size: 'Unknown'
    };
  } catch (error) {
    console.error('Failed to get database info:', error);
    return {};
  }
}

async function getTableStatus(): Promise<{
  name: string;
  rowCount: number;
  status: 'ok' | 'error';
}[]> {
  try {
    // Placeholder for table status - customize based on your database schema
    const tables = ['routes', 'stops', 'drivers', 'vehicles', 'time_slots'];
    const tableStatus = [];
    
    for (const tableName of tables) {
      tableStatus.push({
        name: tableName,
        rowCount: Math.floor(Math.random() * 1000), // Placeholder count
        status: 'ok' as const
      });
    }
    
    return tableStatus;
  } catch (error) {
    console.error('Failed to get table status:', error);
    return [];
  }
}

async function getDatabaseMetrics(): Promise<{
  activeConnections: number;
  maxConnections: number;
  cacheHitRate: number;
}> {
  try {
    // Placeholder for database metrics
    return {
      activeConnections: 5,
      maxConnections: 100,
      cacheHitRate: 0.85
    };
  } catch (error) {
    console.error('Failed to get database metrics:', error);
    return {
      activeConnections: 0,
      maxConnections: 100,
      cacheHitRate: 0
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includeTables = searchParams.get('includeTables') === 'true';
    const includeMetrics = searchParams.get('includeMetrics') === 'true';
    
    // Check database connection
    const connection = await checkDatabaseConnection();
    
    // Determine overall status
    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    
    if (connection.status === 'disconnected' || connection.status === 'timeout') {
      status = 'unhealthy';
    } else if (connection.responseTime && connection.responseTime > 1000) {
      status = 'degraded';
    }
    
    // Get basic database info
    const database = await getDatabaseInfo();
    
    // Build response
    const dbStatus: DatabaseStatus = {
      status,
      timestamp: new Date().toISOString(),
      connection,
      database
    };
    
    // Include table status if requested
    if (includeTables) {
      dbStatus.tables = await getTableStatus();
      
      // Check if any tables have errors
      const errorTables = dbStatus.tables.filter(t => t.status === 'error');
      if (errorTables.length > 0 && status === 'healthy') {
        status = 'degraded';
        dbStatus.status = status;
      }
    }
    
    // Include metrics if requested
    if (includeMetrics) {
      dbStatus.metrics = await getDatabaseMetrics();
      
      // Check connection pool usage
      if (dbStatus.metrics) {
        const connectionUsage = dbStatus.metrics.activeConnections / dbStatus.metrics.maxConnections;
        if (connectionUsage > 0.9 && status === 'healthy') {
          status = 'degraded';
          dbStatus.status = status;
        }
      }
    }
    
    return NextResponse.json(dbStatus, {
      status: status === 'unhealthy' ? 503 : 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('Database status check error:', error);
    
    const errorStatus: DatabaseStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      connection: {
        status: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      database: {}
    };
    
    return NextResponse.json(errorStatus, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { includeTables = false, includeMetrics = false } = body;
    
    // Build URL with query parameters
    const url = new URL(request.url);
    url.searchParams.set('includeTables', includeTables.toString());
    url.searchParams.set('includeMetrics', includeMetrics.toString());
    
    // Forward to GET handler with updated parameters
    const response = await GET(new NextRequest(url.toString(), {
      method: 'GET',
      headers: request.headers
    }));
    
    return response;
    
  } catch (error) {
    console.error('Database status check error:', error);
    
    const errorStatus: DatabaseStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      connection: {
        status: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      database: {}
    };
    
    return NextResponse.json(errorStatus, { status: 503 });
  }
}
