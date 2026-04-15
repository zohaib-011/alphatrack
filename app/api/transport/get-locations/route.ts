import { NextRequest, NextResponse } from 'next/server';

interface LocationData {
  [key: string]: {
    name: string;
    dt_server: string;
    dt_tracker: string;
    lat: string;
    lng: string;
    altitude: string;
    angle: string;
    speed: string;
    params: {
      gpslev: string;
      io1: string;
      io16: string;
      io179: string;
      io199: string;
      io21: string;
      io239: string;
      io24: string;
      io240: string;
      io241: string;
      io246: string;
      io251: string;
      io252: string;
      io66: string;
      io67: string;
      io69: string;
      io80: string;
    };
    loc_valid: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Construct the external API URL with the same parameters
    const apiUrl = 'http://live.alphatrack.pk/api/api.php?api=user&ver=1.0&key=30C9CD37CA76C269FACAB874908D1FB7&cmd=OBJECT_GET_LOCATIONS,*';
    
    // Make request to the external API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
        'Cache-Control': 'max-age=0',
        'Connection': 'keep-alive',
        'Cookie': 'gs_language=english',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36'
      }
    });

    // Get the response data with proper error handling
    let data: LocationData;
    try {
      const responseText = await response.text();
      console.log('External API response status:', response.status);
      console.log('External API response:', responseText);
      
      if (!responseText || responseText.trim() === '') {
        throw new Error('Empty response from external API');
      }
      
      // Check if response starts with "Error" or other non-JSON content
      if (responseText.startsWith('Error') || responseText.startsWith('<')) {
        throw new Error(`External API returned error: ${responseText}`);
      }
      
      // Try to parse JSON - if successful, return the data even if status was 500
      data = JSON.parse(responseText);
      
      // If we got valid JSON but the status was 500, log it but continue
      if (!response.ok) {
        console.warn('External API returned 500 status but with valid JSON data');
      }
      
    } catch (parseError) {
      console.error('Failed to parse external API response:', parseError);
      
      // If parsing failed and response was not ok, return error
      if (!response.ok) {
        return NextResponse.json(
          { 
            error: 'Failed to fetch locations from external API', 
            status: response.status,
            statusText: response.statusText,
            details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
          },
          { status: response.status }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Invalid response from external API', 
          details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
        },
        { status: 502 }
      );
    }
    
    // Return the same response structure as the external API
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching locations' },
      { status: 500 }
    );
  }
}
