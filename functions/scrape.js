import axios from 'axios';
import * as cheerio from 'cheerio';

export const handler = async (event) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    const { url } = JSON.parse(event.body);

    if (!url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'URL is required' })
      };
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid URL format' })
      };
    }

    // Fetch the web page content
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    // Parse HTML with Cheerio
    const $ = cheerio.load(response.data);
    
    // Remove scripts and styles for cleaner content
    $('script').remove();
    $('style').remove();
    $('noscript').remove();

    // Get the main content or body
    const title = $('title').text() || 'No title';
    const content = $('body').html() || $('html').html() || 'No content available';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        title,
        content,
        url
      })
    };

  } catch (error) {
    console.error('Scraping error:', error);
    
    let errorMessage = 'Failed to fetch the webpage';
    if (error.code === 'ENOTFOUND') {
      errorMessage = 'Website not found';
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout';
    } else if (error.response) {
      errorMessage = `HTTP Error: ${error.response.status}`;
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: errorMessage
      })
    };
  }
};