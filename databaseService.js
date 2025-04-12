// JSON Database Service using localStorage

// Database key for presentations
const PRESENTATIONS_KEY = 'smartPresentations';

// Get all saved presentations
export const getSavedPresentations = () => {
  try {
    const savedData = localStorage.getItem(PRESENTATIONS_KEY);
    if (savedData) {
      return JSON.parse(savedData);
    }
    return [];
  } catch (error) {
    console.error('Error retrieving presentations:', error);
    return [];
  }
};

// Save a presentation to the database
export const savePresentation = (presentation) => {
  try {
    // First get existing presentations
    const presentations = getSavedPresentations();
    
    // Add timestamp and ID to the presentation
    const newPresentation = {
      ...presentation,
      id: `pres_${Date.now()}`,
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };
    
    // Add to presentations array
    presentations.push(newPresentation);
    
    // Save back to localStorage
    localStorage.setItem(PRESENTATIONS_KEY, JSON.stringify(presentations));
    
    return newPresentation;
  } catch (error) {
    console.error('Error saving presentation:', error);
    throw error;
  }
};

// Update an existing presentation
export const updatePresentation = (id, updatedPresentation) => {
  try {
    const presentations = getSavedPresentations();
    const index = presentations.findIndex(p => p.id === id);
    
    if (index === -1) {
      throw new Error('Presentation not found');
    }
    
    presentations[index] = {
      ...updatedPresentation,
      id,
      created: presentations[index].created,
      lastModified: new Date().toISOString(),
    };
    
    localStorage.setItem(PRESENTATIONS_KEY, JSON.stringify(presentations));
    return presentations[index];
  } catch (error) {
    console.error('Error updating presentation:', error);
    throw error;
  }
};

// Delete a presentation
export const deletePresentation = (id) => {
  try {
    const presentations = getSavedPresentations();
    const updatedPresentations = presentations.filter(p => p.id !== id);
    
    localStorage.setItem(PRESENTATIONS_KEY, JSON.stringify(updatedPresentations));
    return true;
  } catch (error) {
    console.error('Error deleting presentation:', error);
    throw error;
  }
};

// Get a single presentation by ID
export const getPresentationById = (id) => {
  try {
    const presentations = getSavedPresentations();
    return presentations.find(p => p.id === id);
  } catch (error) {
    console.error('Error retrieving presentation:', error);
    return null;
  }
}; 