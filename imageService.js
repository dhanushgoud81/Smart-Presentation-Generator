import axios from 'axios';

// Use a CORS proxy for development environments
const CORS_PROXY = 'https://corsproxy.io/?';
const UNSPLASH_API_URL = 'https://api.unsplash.com';

// Search for images using Unsplash API with fallback options
export const searchImages = async (query, page = 1, perPage = 10, apiKey, secretKey = null) => {
  if (!apiKey) {
    throw new Error('Unsplash API key is required');
  }

  try {
    // Try direct request first, then with CORS proxy if that fails
    return await tryWithFallbacks([
      () => directSearchRequest(query, page, perPage, apiKey, secretKey),
      () => proxiedSearchRequest(query, page, perPage, apiKey, secretKey)
    ]);
  } catch (error) {
    console.error('All image search attempts failed:', error);
    
    // Add more specific error message based on the error type
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (error.response.status === 401) {
        throw new Error('Invalid API key. Please check your Unsplash API key in settings.');
      } else if (error.response.status === 429) {
        throw new Error('API rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`API error: ${error.response.status} - ${error.response.data?.error || 'Unknown error'}`);
      }
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('Network error. Please check your internet connection and try again.');
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error(`Image search error: ${error.message}`);
    }
  }
};

// Direct request to Unsplash API
const directSearchRequest = async (query, page, perPage, apiKey, secretKey = null) => {
  try {
    console.log('Attempting direct Unsplash API request...');
    
    // Headers based on available credentials
    let headers = {
      'Content-Type': 'application/json'
    };
    
    // If both keys are available, use them for better rate limits
    if (apiKey && secretKey) {
      headers['Authorization'] = `Client-ID ${apiKey}`;
      headers['X-Secret-Key'] = secretKey;
    } else if (apiKey) {
      // Fallback to just Client-ID if only access key is available
      headers['Authorization'] = `Client-ID ${apiKey}`;
    }
    
    const response = await axios.get(`${UNSPLASH_API_URL}/search/photos`, {
      params: {
        query,
        page,
        per_page: perPage
      },
      headers,
      timeout: 10000 // 10 second timeout
    });
    
    console.log('Direct request successful');
    return {
      photos: response.data.results.map(transformUnsplashResult),
      total_results: response.data.total,
      page: page,
      per_page: perPage,
      next_page: page + 1
    };
  } catch (error) {
    console.error('Direct request failed:', error.message);
    throw error;
  }
};

// Proxied request through CORS proxy
const proxiedSearchRequest = async (query, page, perPage, apiKey, secretKey = null) => {
  try {
    console.log('Attempting proxied Unsplash API request...');
    
    // Headers based on available credentials
    let headers = {
      'Content-Type': 'application/json'
    };
    
    // If both keys are available, use them for better rate limits
    if (apiKey && secretKey) {
      headers['Authorization'] = `Client-ID ${apiKey}`;
      headers['X-Secret-Key'] = secretKey;
    } else if (apiKey) {
      // Fallback to just Client-ID if only access key is available
      headers['Authorization'] = `Client-ID ${apiKey}`;
    }
    
    const response = await axios.get(`${CORS_PROXY}${UNSPLASH_API_URL}/search/photos`, {
      params: {
        query,
        page,
        per_page: perPage
      },
      headers,
      timeout: 15000 // 15 second timeout
    });
    
    console.log('Proxied request successful');
    return {
      photos: response.data.results.map(transformUnsplashResult),
      total_results: response.data.total,
      page: page,
      per_page: perPage,
      next_page: page + 1
    };
  } catch (error) {
    console.error('Proxied request failed:', error.message);
    throw error;
  }
};

// Transform Unsplash API result to match our expected format
const transformUnsplashResult = (item) => ({
  id: item.id,
  src: {
    medium: item.urls.small,
    large: item.urls.regular
  },
  alt: item.alt_description || item.description || 'Unsplash image',
  photographer: item.user.name,
  photographer_url: item.user.links.html
});

// Try multiple approaches in sequence until one succeeds
async function tryWithFallbacks(promiseFunctions) {
  let lastError = null;
  
  for (const fn of promiseFunctions) {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      console.log('Attempt failed, trying next method...');
      lastError = error;
    }
  }
  
  // If we get here, all attempts failed
  console.error('All attempts failed');
  throw lastError;
}

// Get sample images when API fails completely
export const getSampleImages = (query) => {
  // Expanded set of sample images by category
  const sampleImages = {
    'nature': [
      { id: 'sample1', src: { medium: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=600&auto=format&fit=crop', large: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=1200&auto=format&fit=crop' } },
      { id: 'sample2', src: { medium: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&auto=format&fit=crop', large: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&auto=format&fit=crop' } },
      { id: 'sample9', src: { medium: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&auto=format&fit=crop', large: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&auto=format&fit=crop' } },
      { id: 'sample10', src: { medium: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=600&auto=format&fit=crop', large: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=1200&auto=format&fit=crop' } }
    ],
    'business': [
      { id: 'sample3', src: { medium: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&auto=format&fit=crop', large: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&auto=format&fit=crop' } },
      { id: 'sample4', src: { medium: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=600&auto=format&fit=crop', large: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=1200&auto=format&fit=crop' } },
      { id: 'sample11', src: { medium: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop', large: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop' } },
      { id: 'sample12', src: { medium: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop', large: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&auto=format&fit=crop' } }
    ],
    'technology': [
      { id: 'sample5', src: { medium: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&auto=format&fit=crop', large: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop' } },
      { id: 'sample6', src: { medium: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&auto=format&fit=crop', large: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1200&auto=format&fit=crop' } },
      { id: 'sample13', src: { medium: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop', large: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop' } },
      { id: 'sample14', src: { medium: 'https://images.unsplash.com/photo-1488229297570-58520851e868?w=600&auto=format&fit=crop', large: 'https://images.unsplash.com/photo-1488229297570-58520851e868?w=1200&auto=format&fit=crop' } }
    ],
    'education': [
      { id: 'sample15', src: { medium: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&auto=format&fit=crop', large: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&auto=format&fit=crop' } },
      { id: 'sample16', src: { medium: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&auto=format&fit=crop', large: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&auto=format&fit=crop' } },
    ],
    'health': [
      { id: 'sample17', src: { medium: 'https://images.unsplash.com/photo-1511688878353-3a2f5be94cd7?w=600&auto=format&fit=crop', large: 'https://images.unsplash.com/photo-1511688878353-3a2f5be94cd7?w=1200&auto=format&fit=crop' } },
      { id: 'sample18', src: { medium: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&auto=format&fit=crop', large: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&auto=format&fit=crop' } },
    ],
    'marketing': [
      { id: 'sample19', src: { medium: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop', large: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop' } },
      { id: 'sample20', src: { medium: 'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=600&auto=format&fit=crop', large: 'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=1200&auto=format&fit=crop' } },
    ],
    'default': [
      { id: 'sample7', src: { medium: 'https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?w=600&auto=format&fit=crop', large: 'https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?w=1200&auto=format&fit=crop' } },
      { id: 'sample8', src: { medium: 'https://images.unsplash.com/photo-1498075702571-ecb018f3752d?w=600&auto=format&fit=crop', large: 'https://images.unsplash.com/photo-1498075702571-ecb018f3752d?w=1200&auto=format&fit=crop' } },
      { id: 'sample21', src: { medium: 'https://images.unsplash.com/photo-1579389083395-4507e98b5e67?w=600&auto=format&fit=crop', large: 'https://images.unsplash.com/photo-1579389083395-4507e98b5e67?w=1200&auto=format&fit=crop' } },
      { id: 'sample22', src: { medium: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&auto=format&fit=crop', large: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&auto=format&fit=crop' } }
    ]
  };
  
  // Find the best matching category or use default
  const queryLower = query.toLowerCase();
  let category = 'default';
  
  for (const cat of Object.keys(sampleImages)) {
    if (queryLower.includes(cat)) {
      category = cat;
      break;
    }
  }
  
  return {
    photos: sampleImages[category],
    total_results: sampleImages[category].length,
    page: 1,
    per_page: sampleImages[category].length,
    next_page: null
  };
};

// Get a specific image by ID
export const getImageById = async (id, apiKey, secretKey = null) => {
  try {
    if (!apiKey) {
      throw new Error('Unsplash API key is required');
    }

    // Headers based on available credentials
    let headers = {
      'Content-Type': 'application/json'
    };
    
    // If both keys are available, use them for better rate limits
    if (apiKey && secretKey) {
      headers['Authorization'] = `Client-ID ${apiKey}`;
      headers['X-Secret-Key'] = secretKey;
    } else if (apiKey) {
      // Fallback to just Client-ID if only access key is available
      headers['Authorization'] = `Client-ID ${apiKey}`;
    }

    const response = await axios.get(`${UNSPLASH_API_URL}/photos/${id}`, {
      headers
    });

    return transformUnsplashResult(response.data);
  } catch (error) {
    console.error('Error getting image:', error);
    throw error;
  }
}; 