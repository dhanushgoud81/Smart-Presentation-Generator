import React, { useState, useEffect, StrictMode } from 'react';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  IconButton as MuiIconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondary,
  Divider,
  Card,
  CardContent,
  Tab,
  Tabs,
  Grid,
  AppBar,
  Toolbar,
  Drawer,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  CssBaseline,
  ThemeProvider,
  createTheme
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SettingsIcon from '@mui/icons-material/Settings';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import InfoIcon from '@mui/icons-material/Info';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import FolderIcon from '@mui/icons-material/Folder';
import ImageIcon from '@mui/icons-material/Image';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import ClearIcon from '@mui/icons-material/Clear';
import { generatePresentation, generatePresentationContent } from './services/presentationService';
import { getSavedPresentations, savePresentation, updatePresentation, deletePresentation, getPresentationById } from './services/databaseService';
import { searchImages, getSampleImages } from './services/imageService';
import {
  Menu as MenuIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Preview as PreviewIcon,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function App() {
  const [presentationData, setPresentationData] = useState({
    title: '',
    slides: [{ title: '', content: '' }],
  });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [numSlides, setNumSlides] = useState(5);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [savedPresentations, setSavedPresentations] = useState([]);
  const [currentPresentationId, setCurrentPresentationId] = useState(null);
  const [unsplashApiKey, setUnsplashApiKey] = useState('');
  const [unsplashSecretKey, setUnsplashSecretKey] = useState('');
  const [imageSearchDialogOpen, setImageSearchDialogOpen] = useState(false);
  const [imageSearchQuery, setImageSearchQuery] = useState('');
  const [searchingImages, setSearchingImages] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [titleImageMode, setTitleImageMode] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode === 'true';
  });
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [slideToDelete, setSlideToDelete] = useState(null);
  
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#3f51b5',
      },
      secondary: {
        main: '#f50057',
      },
    },
  });
  
  const handleToggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
  };
  
  useEffect(() => {
    try {
      const savedApiKey = window.localStorage.getItem('groqApiKey');
      console.log('API key retrieved:', savedApiKey ? 'Key found' : 'No key found');
      
      if (savedApiKey && savedApiKey.trim() !== '') {
        setApiKey(savedApiKey);
      } else {
        console.log('No valid API key found in localStorage');
      }
    } catch (error) {
      console.error('Error retrieving API key:', error);
    }
    
    loadPresentations();
  }, []);
  
  const loadPresentations = () => {
    const presentations = getSavedPresentations();
    setSavedPresentations(presentations);
  };

  const handleAddSlide = () => {
    setPresentationData({
      ...presentationData,
      slides: [...presentationData.slides, { title: '', content: '' }],
    });
  };

  const handleDeleteConfirmation = (slideIndex) => {
    setSlideToDelete(slideIndex);
    setDeleteDialogOpen(true);
  };

  const handleRemoveSlide = () => {
    if (slideToDelete === null) return;
    
    const newSlides = presentationData.slides.filter((_, i) => i !== slideToDelete);
    setPresentationData({
      ...presentationData,
      slides: newSlides,
    });
    
    setDeleteDialogOpen(false);
    setSlideToDelete(null);
  };

  const handleSlideChange = (index, field, value) => {
    const newSlides = [...presentationData.slides];
    newSlides[index][field] = value;
    setPresentationData({
      ...presentationData,
      slides: newSlides,
    });
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const pptBlob = await generatePresentation(presentationData);
      
      const url = window.URL.createObjectURL(pptBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PPT_Maker_${presentationData.title || 'presentation'}.pptx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSnackbar({
        open: true,
        message: 'Presentation generated successfully! Saved to your downloads folder.',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error generating presentation. Please try again.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAiGenerate = async () => {
    try {
      setAiLoading(true);
      const generatedContent = await generatePresentationContent(topic, numSlides, apiKey);
      setPresentationData(generatedContent);
      setAiDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'Content generated successfully!',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error generating content. Please try again.',
        severity: 'error',
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveApiKey = () => {
    try {
      window.localStorage.setItem('groqApiKey', apiKey);
      console.log('API key saved:', apiKey ? 'Key provided' : 'No key provided');
      
      setSettingsDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'API key saved successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error saving API key:', error);
      setSnackbar({
        open: true,
        message: 'Error saving API key. Check console for details.',
        severity: 'error',
      });
    }
  };
  
  const handleSavePresentation = () => {
    try {
      if (!presentationData.title) {
        setSnackbar({
          open: true,
          message: 'Please add a title to your presentation',
          severity: 'warning',
        });
        return;
      }
      
      let savedPresentation;
      
      if (currentPresentationId) {
        savedPresentation = updatePresentation(currentPresentationId, presentationData);
      } else {
        savedPresentation = savePresentation(presentationData);
        setCurrentPresentationId(savedPresentation.id);
      }
      
      loadPresentations();
      
      setSnackbar({
        open: true,
        message: 'Presentation saved successfully!',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error saving presentation. Please try again.',
        severity: 'error',
      });
    }
  };
  
  const handleLoadPresentation = (id) => {
    try {
      const presentation = getPresentationById(id);
      if (presentation) {
        setPresentationData(presentation);
        setCurrentPresentationId(id);
        setTabValue(0);
        
        setSnackbar({
          open: true,
          message: 'Presentation loaded successfully!',
          severity: 'success',
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error loading presentation. Please try again.',
        severity: 'error',
      });
    }
  };
  
  const handleDeletePresentation = (id) => {
    try {
      deletePresentation(id);
      
      if (id === currentPresentationId) {
        setPresentationData({
          title: '',
          slides: [{ title: '', content: '' }],
        });
        setCurrentPresentationId(null);
      }
      
      loadPresentations();
      
      setSnackbar({
        open: true,
        message: 'Presentation deleted successfully!',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error deleting presentation. Please try again.',
        severity: 'error',
      });
    }
  };
  
  const handleNewPresentation = () => {
    setPresentationData({
      title: '',
      slides: [{ title: '', content: '' }],
    });
    setCurrentPresentationId(null);
    setTabValue(0);
  };

  useEffect(() => {
    try {
      const savedUnsplashApiKey = window.localStorage.getItem('unsplashApiKey');
      console.log('Unsplash API key retrieved:', savedUnsplashApiKey ? 'Key found' : 'No key found');
      
      if (savedUnsplashApiKey && savedUnsplashApiKey.trim() !== '') {
        setUnsplashApiKey(savedUnsplashApiKey);
      } else {
        console.log('No valid Unsplash API key found in localStorage');
      }
    } catch (error) {
      console.error('Error retrieving Unsplash API key:', error);
    }
  }, []);

  const handleSaveUnsplashApiKey = () => {
    try {
      window.localStorage.setItem('unsplashApiKey', unsplashApiKey);
      console.log('Unsplash API key saved:', unsplashApiKey ? 'Key provided' : 'No key provided');
      
      setSnackbar({
        open: true,
        message: 'Unsplash API key saved successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error saving Unsplash API key:', error);
      setSnackbar({
        open: true,
        message: 'Error saving Unsplash API key. Check console for details.',
        severity: 'error',
      });
    }
  };

  const handleSaveUnsplashSecretKey = () => {
    try {
      window.localStorage.setItem('unsplashSecretKey', unsplashSecretKey);
      console.log('Unsplash Secret Key saved:', unsplashSecretKey ? 'Key provided' : 'No key provided');
      
      setSnackbar({
        open: true,
        message: 'Unsplash Secret Key saved successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error saving Unsplash Secret Key:', error);
      setSnackbar({
        open: true,
        message: 'Error saving Unsplash Secret Key. Check console for details.',
        severity: 'error',
      });
    }
  };

  const handleSaveUnsplashKeys = () => {
    try {
      window.localStorage.setItem('unsplashApiKey', unsplashApiKey);
      window.localStorage.setItem('unsplashSecretKey', unsplashSecretKey);
      
      console.log('Unsplash API Key saved:', unsplashApiKey ? 'Key provided' : 'No key provided');
      console.log('Unsplash Secret Key saved:', unsplashSecretKey ? 'Key provided' : 'No key provided');
      
      setSnackbar({
        open: true,
        message: 'Unsplash API Keys saved successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error saving Unsplash API Keys:', error);
      setSnackbar({
        open: true,
        message: 'Error saving Unsplash API Keys. Check console for details.',
        severity: 'error',
      });
    }
  };

  const handleImageSearch = async () => {
    if (!imageSearchQuery.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter a search query',
        severity: 'warning',
      });
      return;
    }
    
    setSearchingImages(true);
    
    try {
      let results;
      
      if (unsplashApiKey && unsplashApiKey.trim() !== '') {
        try {
          console.log('Attempting to search with Unsplash API...');
          results = await searchImages(imageSearchQuery, 1, 15, unsplashApiKey, unsplashSecretKey);
          console.log('Search succeeded with API');
        } catch (apiError) {
          console.error('API search failed:', apiError.message);
          
          results = getSampleImages(imageSearchQuery);
          
          let errorMessage = 'Network error with Unsplash API. Using sample images instead.';
          
          if (apiError.message.includes('Invalid API key')) {
            errorMessage = 'Invalid Unsplash API key. Please check your settings. Using sample images instead.';
          } else if (apiError.message.includes('rate limit')) {
            errorMessage = 'Unsplash API rate limit exceeded. Using sample images instead. Please try again later.';
          } else if (apiError.message.includes('Network error')) {
            errorMessage = 'Network connection error. Please check your internet connection. Using sample images instead.';
          } else if (apiError.message.includes('API error')) {
            errorMessage = `${apiError.message}. Using sample images instead.`;
          }
          
          setSnackbar({
            open: true,
            message: errorMessage,
            severity: 'warning',
          });
        }
      } else {
        console.log('No API key, using sample images');
        results = getSampleImages(imageSearchQuery);
      }
      
      if (!results || !results.photos || results.photos.length === 0) {
        setSearchResults([]);
        setSnackbar({
          open: true,
          message: 'No images found. Try a different search term.',
          severity: 'info',
        });
      } else {
        setSearchResults(results.photos);
      }
    } catch (error) {
      console.error('Error in image search process:', error);
      
      const sampleResults = getSampleImages(imageSearchQuery);
      setSearchResults(sampleResults.photos);
      
      setSnackbar({
        open: true,
        message: 'Error connecting to image service. Using sample images instead.',
        severity: 'error',
      });
    } finally {
      setSearchingImages(false);
    }
  };

  const handleSelectImage = (imageUrl) => {
    const updatedPresentationData = { ...presentationData };
    
    if (titleImageMode) {
      updatedPresentationData.titleImage = imageUrl;
    } else {
      const updatedSlides = [...updatedPresentationData.slides];
      updatedSlides[currentSlideIndex] = {
        ...updatedSlides[currentSlideIndex],
        image: imageUrl
      };
      updatedPresentationData.slides = updatedSlides;
    }
    
    setPresentationData(updatedPresentationData);
    setImageSearchDialogOpen(false);
    setSnackbar({
      open: true,
      message: 'Image added successfully!',
      severity: 'success',
    });
  };

  const openImageSearch = (slideIndex, isTitleImage = false) => {
    setCurrentSlideIndex(slideIndex);
    setTitleImageMode(isTitleImage);
    setImageSearchQuery('');
    setSearchResults([]);
    setImageSearchDialogOpen(true);
  };

  const handlePreviewPresentation = () => {
    setPreviewSlideIndex(0);
    setPreviewDialogOpen(true);
  };

  const currentSlide = presentationData && presentationData.slides && 
    presentationData.slides.length > 0 && previewSlideIndex > 0 ? 
    presentationData.slides[previewSlideIndex - 1] : null;

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  const handleDragEnd = (result) => {
    if (!result.destination) {
      return;
    }

    const reorderedSlides = reorderSlides(
      presentationData.slides,
      result.source.index,
      result.destination.index
    );

    setPresentationData({
      ...presentationData,
      slides: reorderedSlides
    });
  };

  const reorderSlides = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  // Add the useEffect for loading Unsplash Secret Key
  useEffect(() => {
    try {
      const savedUnsplashSecretKey = window.localStorage.getItem('unsplashSecretKey');
      console.log('Unsplash Secret Key retrieved:', savedUnsplashSecretKey ? 'Key found' : 'No key found');
      
      if (savedUnsplashSecretKey && savedUnsplashSecretKey.trim() !== '') {
        setUnsplashSecretKey(savedUnsplashSecretKey);
      } else {
        console.log('No valid Unsplash Secret Key found in localStorage');
      }
    } catch (error) {
      console.error('Error retrieving Unsplash Secret Key:', error);
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="static">
          <Toolbar>
            <IconButton 
              edge="start" 
              color="inherit" 
              aria-label="menu" 
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Smart Presentation Generator
            </Typography>
            <Tooltip title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
              <IconButton color="inherit" onClick={handleToggleDarkMode}>
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Preview Presentation">
              <IconButton 
                color="inherit"
                onClick={handlePreviewPresentation}
                disabled={!presentationData || !presentationData.slides || presentationData.slides.length === 0}
              >
                <PreviewIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton color="inherit" onClick={() => setSettingsDialogOpen(true)}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>
        
        <Container maxWidth="md">
          <Box sx={{ my: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h3" component="h1" gutterBottom>
                Smart Presentation Generator
              </Typography>
            </Box>
            
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                <Tab label="Editor" />
                <Tab label="My Presentations" />
              </Tabs>
            </Box>

            {tabValue === 0 && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<AutoFixHighIcon />}
                    onClick={() => setAiDialogOpen(true)}
                  >
                    AI Generate Content
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<SaveIcon />}
                    onClick={handleSavePresentation}
                  >
                    Save to Database
                  </Button>
                </Box>

                <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <TextField
                      fullWidth
                      label="Presentation Title"
                      value={presentationData.title}
                      onChange={(e) => setPresentationData({ ...presentationData, title: e.target.value })}
                      margin="normal"
                      sx={{ mr: 2 }}
                    />
                    <Button
                      variant="outlined"
                      startIcon={presentationData.titleImage ? <ImageIcon /> : <AddPhotoAlternateIcon />}
                      onClick={() => openImageSearch(0, true)}
                      sx={{ height: 56 }}
                    >
                      {presentationData.titleImage ? 'Change' : 'Add'} Title Image
                    </Button>
                  </Box>
                  
                  {presentationData.titleImage && (
                    <Box sx={{ mt: 2, position: 'relative' }}>
                      <img 
                        src={presentationData.titleImage} 
                        alt="Title" 
                        style={{ width: '100%', maxHeight: '200px', objectFit: 'contain' }} 
                      />
                      <IconButton
                        size="small"
                        sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(255,255,255,0.7)' }}
                        onClick={() => {
                          setPresentationData({...presentationData, titleImage: null});
                        }}
                      >
                        <ClearIcon />
                      </IconButton>
                    </Box>
                  )}
                </Paper>

                <StrictMode>
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="slides">
                      {(provided) => (
                        <div 
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                        >
                          {presentationData.slides.map((slide, index) => (
                            <Draggable key={`slide-${index}`} draggableId={`slide-${index}`} index={index}>
                              {(provided, snapshot) => (
                                <Paper 
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  elevation={3} 
                                  sx={{ 
                                    p: 3, 
                                    mb: 3,
                                    background: snapshot.isDragging ? 'rgba(63, 81, 181, 0.08)' : 'inherit',
                                    border: snapshot.isDragging ? '1px dashed #3f51b5' : 'none',
                                  }}
                                >
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Box 
                                      {...provided.dragHandleProps} 
                                      sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        cursor: 'grab',
                                        '&:active': { cursor: 'grabbing' }
                                      }}
                                    >
                                      <Typography variant="h6" sx={{ mr: 1 }}>Slide {index + 1}</Typography>
                                      <IconButton size="small">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                          <path d="M4 8h16v2H4V8zm0 5h16v2H4v-2z" />
                                        </svg>
                                      </IconButton>
                                    </Box>
                                    <Box>
                                      <Button
                                        variant="outlined"
                                        startIcon={slide.image ? <ImageIcon /> : <AddPhotoAlternateIcon />}
                                        onClick={() => openImageSearch(index)}
                                        sx={{ mr: 1 }}
                                      >
                                        {slide.image ? 'Change' : 'Add'} Image
                                      </Button>
                                      {index > 0 && (
                                        <IconButton onClick={() => handleDeleteConfirmation(index)} color="error">
                                          <DeleteIcon />
                                        </IconButton>
                                      )}
                                    </Box>
                                  </Box>
                                  
                                  <Grid container spacing={2}>
                                    <Grid item xs={slide.image ? 6 : 12}>
                                      <TextField
                                        fullWidth
                                        label="Slide Title"
                                        value={slide.title}
                                        onChange={(e) => handleSlideChange(index, 'title', e.target.value)}
                                        margin="normal"
                                      />
                                      <TextField
                                        fullWidth
                                        label="Slide Content"
                                        value={slide.content}
                                        onChange={(e) => handleSlideChange(index, 'content', e.target.value)}
                                        margin="normal"
                                        multiline
                                        rows={4}
                                      />
                                    </Grid>
                                    
                                    {slide.image && (
                                      <Grid item xs={6}>
                                        <Box sx={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                          <img 
                                            src={slide.image} 
                                            alt={`Slide ${index + 1}`} 
                                            style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} 
                                          />
                                          <IconButton
                                            size="small"
                                            sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'rgba(255,255,255,0.7)' }}
                                            onClick={() => {
                                              const updatedSlides = [...presentationData.slides];
                                              updatedSlides[index] = {...updatedSlides[index], image: null};
                                              setPresentationData({...presentationData, slides: updatedSlides});
                                            }}
                                          >
                                            <ClearIcon />
                                          </IconButton>
                                        </Box>
                                      </Grid>
                                    )}
                                  </Grid>
                                </Paper>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </StrictMode>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddSlide}
                  >
                    Add Slide
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleGenerate}
                    disabled={loading || !presentationData.title}
                  >
                    {loading ? 'Generating...' : 'Generate PPTX'}
                  </Button>
                </Box>
              </>
            )}
            
            {tabValue === 1 && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={handleNewPresentation}
                  >
                    New Presentation
                  </Button>
                </Box>
                
                {savedPresentations.length === 0 ? (
                  <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      No saved presentations
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                      Click "New Presentation" to create one or "AI Generate Content" to start with AI.
                    </Typography>
                  </Paper>
                ) : (
                  <Grid container spacing={2}>
                    {savedPresentations.map((presentation) => (
                      <Grid item xs={12} key={presentation.id}>
                        <Card>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="h6">{presentation.title}</Typography>
                                <Typography variant="body2" color="textSecondary">
                                  {new Date(presentation.lastModified).toLocaleString()} • {presentation.slides.length} slides
                                </Typography>
                              </Box>
                              <Box>
                                <IconButton 
                                  color="primary" 
                                  onClick={() => handleLoadPresentation(presentation.id)}
                                  title="Edit presentation"
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton 
                                  color="secondary" 
                                  onClick={async () => {
                                    try {
                                      setLoading(true);
                                      const pptBlob = await generatePresentation(presentation);
                                      const url = window.URL.createObjectURL(pptBlob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = `PPT_Maker_${presentation.title}.pptx`;
                                      document.body.appendChild(a);
                                      a.click();
                                      window.URL.revokeObjectURL(url);
                                      document.body.removeChild(a);
                                    } catch (error) {
                                      setSnackbar({
                                        open: true,
                                        message: 'Error generating presentation.',
                                        severity: 'error',
                                      });
                                    } finally {
                                      setLoading(false);
                                    }
                                  }}
                                  title="Download as PPTX"
                                >
                                  <FolderIcon />
                                </IconButton>
                                <IconButton 
                                  color="error" 
                                  onClick={() => handleDeletePresentation(presentation.id)}
                                  title="Delete presentation"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </>
            )}
          </Box>
        </Container>

        <Dialog
          open={previewDialogOpen}
          onClose={() => setPreviewDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Preview: {presentationData?.title || 'Presentation'}
          </DialogTitle>
          <DialogContent>
            {presentationData && presentationData.slides && presentationData.slides.length > 0 ? (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Button 
                    onClick={() => setPreviewSlideIndex(prev => Math.max(0, prev - 1))}
                    disabled={previewSlideIndex === 0}
                  >
                    Previous
                  </Button>
                  <Typography>
                    Slide {previewSlideIndex + 1} of {presentationData.slides.length + 1}
                  </Typography>
                  <Button 
                    onClick={() => setPreviewSlideIndex(prev => Math.min(presentationData.slides.length, prev + 1))}
                    disabled={previewSlideIndex >= presentationData.slides.length}
                  >
                    Next
                  </Button>
                </Box>
                
                <Paper
                  elevation={3}
                  sx={{
                    width: '100%',
                    aspectRatio: '16/9',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    p: 4,
                    position: 'relative',
                    overflow: 'hidden',
                    textAlign: 'center',
                    my: 2
                  }}
                >
                  {previewSlideIndex === 0 ? (
                    <>
                      {presentationData.titleImage && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            zIndex: 0,
                          }}
                        >
                          <img
                            src={presentationData.titleImage}
                            alt="Title background"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              opacity: 0.3,
                            }}
                          />
                        </Box>
                      )}
                      <Typography variant="h3" component="div" sx={{ zIndex: 1, mb: 2 }}>
                        {presentationData.title}
                      </Typography>
                      <Typography variant="h5" color="textSecondary" sx={{ zIndex: 1 }}>
                        {presentationData.subtitle}
                      </Typography>
                    </>
                  ) : (
                    <>
                      {currentSlide.image && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            zIndex: 0
                          }}
                        >
                          <img
                            src={currentSlide.image}
                            alt="Slide background"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              opacity: 0.2
                            }}
                          />
                        </Box>
                      )}
                      <Typography 
                        variant="h4" 
                        component="div" 
                        sx={{ zIndex: 1, mb: 3 }}
                      >
                        {currentSlide.title}
                      </Typography>
                      <Box sx={{ zIndex: 1, textAlign: 'left', width: '100%' }}>
                        {currentSlide.content.split('\n').map((point, i) => (
                          <Typography key={i} variant="body1" sx={{ mb: 1 }}>
                            • {point}
                          </Typography>
                        ))}
                      </Box>
                    </>
                  )}
                </Paper>
              </Box>
            ) : (
              <Typography>No slides to preview</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={aiDialogOpen} onClose={() => setAiDialogOpen(false)}>
          <DialogTitle>AI Content Generation</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Presentation Topic"
              fullWidth
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <TextField
              margin="dense"
              label="Number of Slides"
              type="number"
              fullWidth
              value={numSlides}
              onChange={(e) => setNumSlides(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
              inputProps={{ min: 1, max: 20 }}
            />
            {!apiKey && (
              <Box sx={{ mt: 2 }}>
                <Alert 
                  severity="warning"
                  action={
                    <Button 
                      color="inherit" 
                      size="small"
                      onClick={() => {
                        setAiDialogOpen(false);
                        setSettingsDialogOpen(true);
                      }}
                    >
                      Set Key
                    </Button>
                  }
                >
                  No API key set. A template will be generated instead.
                </Alert>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAiDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleAiGenerate} 
              disabled={aiLoading || !topic}
              startIcon={aiLoading ? <CircularProgress size={20} /> : null}
            >
              Generate
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={settingsDialogOpen} onClose={() => setSettingsDialogOpen(false)} maxWidth="md">
          <DialogTitle>Settings</DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 4, mt: 1 }}>
              <Typography variant="h6" gutterBottom>Groq API Settings</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Enter your Groq API key to enable AI content generation.
                <Tooltip title="You can get a Groq API key by signing up at https://console.groq.com">
                  <InfoIcon sx={{ ml: 1, verticalAlign: 'middle', fontSize: '1rem', color: 'primary.main' }} />
                </Tooltip>
              </Typography>
              <TextField
                fullWidth
                label="Groq API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                type={showApiKey ? 'text' : 'password'}
                placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxx"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <MuiIconButton
                        onClick={() => setShowApiKey(!showApiKey)}
                        edge="end"
                      >
                        {showApiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </MuiIconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                Your API key should start with 'gsk_' and will be saved in your browser.
              </Typography>
              <Button 
                onClick={handleSaveApiKey} 
                color="primary"
                disabled={!apiKey || !apiKey.startsWith('gsk_')}
                sx={{ mt: 1 }}
              >
                Save Groq API Key
              </Button>
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>Unsplash API Settings</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Enter your Unsplash API keys to enable image search.
                <Tooltip title="Get your API keys by signing up at https://unsplash.com/developers">
                  <InfoIcon sx={{ ml: 1, verticalAlign: 'middle', fontSize: '1rem', color: 'primary.main' }} />
                </Tooltip>
              </Typography>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                Adding both your Access Key (Client ID) and Secret Key will provide better rate limits for API requests.
              </Alert>
              
              <TextField
                fullWidth
                label="Unsplash Access Key (Client ID)"
                value={unsplashApiKey}
                onChange={(e) => setUnsplashApiKey(e.target.value)}
                type={showApiKey ? 'text' : 'password'}
                placeholder="Your Unsplash Access Key (Client ID)"
                margin="normal"
              />
              
              <TextField
                fullWidth
                label="Unsplash Secret Key"
                value={unsplashSecretKey}
                onChange={(e) => setUnsplashSecretKey(e.target.value)}
                type={showApiKey ? 'text' : 'password'}
                placeholder="Your Unsplash Secret Key"
                margin="normal"
                helperText="Optional: Adding your Secret Key enables higher rate limits"
              />
              
              <Button 
                onClick={handleSaveUnsplashKeys} 
                color="primary"
                disabled={!unsplashApiKey}
                sx={{ mt: 1 }}
              >
                Save Unsplash API Keys
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSettingsDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        <Dialog 
          open={imageSearchDialogOpen} 
          onClose={() => setImageSearchDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {titleImageMode ? 'Add Title Image' : `Add Image to Slide ${currentSlideIndex + 1}`}
          </DialogTitle>
          <DialogContent>
            {!unsplashApiKey ? (
              <Alert 
                severity="warning" 
                action={
                  <Button 
                    color="inherit" 
                    size="small"
                    onClick={() => {
                      setImageSearchDialogOpen(false);
                      setSettingsDialogOpen(true);
                    }}
                  >
                    Set Key
                  </Button>
                }
                sx={{ mb: 2 }}
              >
                Please set your Unsplash API key in settings to search for images.
              </Alert>
            ) : (
              <>
                <Box sx={{ display: 'flex', mb: 2, mt: 1 }}>
                  <TextField
                    fullWidth
                    label="Search for images"
                    value={imageSearchQuery}
                    onChange={(e) => setImageSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleImageSearch()}
                    margin="normal"
                    sx={{ flexGrow: 1, mr: 1 }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleImageSearch}
                    disabled={searchingImages || !imageSearchQuery.trim()}
                    sx={{ mt: 2 }}
                  >
                    {searchingImages ? <CircularProgress size={24} /> : 'Search'}
                  </Button>
                </Box>
                
                <Alert severity="info" sx={{ mb: 2 }}>
                  If you encounter network errors with the Unsplash API, the app will automatically use sample images as a fallback.
                  This ensures you can still create presentations when API connectivity is limited.
                </Alert>
                
                {searchResults.length > 0 ? (
                  <Grid container spacing={2}>
                    {searchResults.map((photo) => (
                      <Grid item xs={6} sm={4} md={3} key={photo.id}>
                        <Card sx={{ cursor: 'pointer' }} onClick={() => handleSelectImage(photo.src.large)}>
                          <CardContent sx={{ p: 1 }}>
                            <img 
                              src={photo.src.medium} 
                              alt={photo.alt || 'Image'} 
                              style={{ width: '100%', height: 'auto', display: 'block' }}
                            />
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : searchingImages ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Typography variant="body1" color="textSecondary" align="center" sx={{ py: 4 }}>
                    Search for images to add to your presentation
                  </Typography>
                )}
                
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
                  Images provided by <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">Unsplash</a>
                </Typography>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setImageSearchDialogOpen(false)}>Cancel</Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete Slide {slideToDelete !== null ? slideToDelete + 1 : ''}?
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRemoveSlide} color="error">Delete</Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default App; 