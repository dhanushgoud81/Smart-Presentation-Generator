import pptxgen from 'pptxgenjs';
import axios from 'axios';

const GROQ_API_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

// Fallback content when API fails
const generateFallbackContent = (topic, numSlides) => {
  const slides = [];
  const capitalizedTopic = topic.charAt(0).toUpperCase() + topic.slice(1);
  
  // Introduction slide
  slides.push({
    title: `Introduction to ${capitalizedTopic}`,
    content: `• Overview: ${capitalizedTopic} is an important subject that has significant implications in various contexts.\n• Purpose: This presentation will explore the key aspects, benefits, and applications of ${capitalizedTopic}.\n• Relevance: Understanding ${capitalizedTopic} is essential because it impacts multiple areas of our daily lives and professional environments.`
  });
  
  // Middle slides
  const middleSlidesCount = numSlides - 2; // Excluding intro and conclusion
  for (let i = 0; i < middleSlidesCount; i++) {
    let slideContent = '';
    
    switch (i % 4) {
      case 0:
        slideContent = `• Key Components: ${capitalizedTopic} consists of several important elements that work together to create a comprehensive system.\n• Historical Context: The development of ${capitalizedTopic} has evolved significantly over time, with notable milestones worth examining.\n• Current Applications: Today, ${capitalizedTopic} is used in various contexts including business, education, and personal development.`;
        break;
      case 1:
        slideContent = `• Benefits: Implementing ${capitalizedTopic} offers numerous advantages, including improved efficiency and better outcomes.\n• Challenges: Despite its benefits, there are several challenges to consider when working with ${capitalizedTopic}.\n• Solutions: Several approaches can be used to address these challenges effectively.`;
        break;
      case 2:
        slideContent = `• Case Study: Examining real-world examples of ${capitalizedTopic} provides valuable insights into its practical applications.\n• Statistics: Research indicates that ${capitalizedTopic} has shown significant impact in multiple scenarios.\n• Expert Opinions: Leading professionals in the field have emphasized the importance of ${capitalizedTopic}.`;
        break;
      case 3:
        slideContent = `• Best Practices: To maximize the benefits of ${capitalizedTopic}, certain guidelines should be followed.\n• Common Misconceptions: There are several misunderstandings about ${capitalizedTopic} that should be clarified.\n• Future Trends: The landscape of ${capitalizedTopic} is evolving, with several emerging developments on the horizon.`;
        break;
    }
    
    slides.push({
      title: `Key Aspect ${i+1} of ${capitalizedTopic}`,
      content: slideContent
    });
  }
  
  // Conclusion slide
  slides.push({
    title: `Conclusion: The Future of ${capitalizedTopic}`,
    content: `• Summary: We've explored the key aspects of ${capitalizedTopic}, including its components, benefits, and applications.\n• Key Takeaways: Understanding and implementing ${capitalizedTopic} effectively can lead to significant improvements in relevant areas.\n• Next Steps: To further explore ${capitalizedTopic}, consider additional research, practical applications, and ongoing education in this field.`
  });
  
  return {
    title: `Comprehensive Guide to ${capitalizedTopic}`,
    slides
  };
};

export const generatePresentationContent = async (topic, numSlides = 5, apiKey) => {
  try {
    // Use the passed API key with safety checks
    const groqApiKey = apiKey || '';
    
    console.log('Using API key?', groqApiKey ? 'Yes' : 'No');
    
    if (!groqApiKey || groqApiKey.trim() === '') {
      console.warn('No Groq API key provided, using fallback content');
      return generateFallbackContent(topic, numSlides);
    }

    const prompt = `Create a COMPLETE and DETAILED professional presentation about "${topic}" with exactly ${numSlides} slides.

For each slide, provide:
1. A concise, engaging title
2. Comprehensive content with full sentences, facts, statistics, and examples
3. Use bullet points with detailed explanations (not just short phrases)

The first slide should be an engaging introduction to the topic.
The middle slides should cover key aspects of the topic with detailed information.
The final slide should provide a conclusion with key takeaways.

Format the response as JSON with the following structure:
{
  "title": "A descriptive and engaging presentation title",
  "slides": [
    {
      "title": "Slide Title",
      "content": "• First point: Detailed explanation with facts and context\\n• Second point: More detailed information with examples\\n• Third point: Additional supporting information"
    }
  ]
}

Ensure the response is valid JSON. Use double quotes for JSON properties. Use proper escaping for any special characters.`;

    const response = await axios.post(
      GROQ_API_ENDPOINT,
      {
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: "You are an expert presentation creator specializing in detailed, content-rich presentations. Create well-structured, comprehensive content with facts, examples, and detailed explanations. Always respond in valid JSON format with rich, detailed content for each slide - not just outlines or placeholder text."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 1
      },
      {
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data || !response.data.choices || !response.data.choices[0]) {
      console.warn('Invalid response from Groq API, using fallback content');
      return generateFallbackContent(topic, numSlides);
    }

    const generatedContent = response.data.choices[0].message.content;
    try {
      return JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Error parsing API response:', generatedContent);
      console.warn('Using fallback content due to parse error');
      return generateFallbackContent(topic, numSlides);
    }
  } catch (error) {
    console.error('Error generating presentation content:', error);
    console.warn('Using fallback content due to API error');
    return generateFallbackContent(topic, numSlides);
  }
};

export const generatePresentation = async (presentationData) => {
  try {
    const pptx = new pptxgen();
    
    // Add title slide
    const titleSlide = pptx.addSlide();
    titleSlide.addText(presentationData.title, {
      x: 1,
      y: 1,
      w: '80%',
      h: 1,
      fontSize: 44,
      color: '363636',
      align: 'center',
    });
    
    // Add title image if available
    if (presentationData.titleImage) {
      try {
        titleSlide.addImage({
          path: presentationData.titleImage, // Use the URL directly
          x: 0.5,
          y: 2.5,
          w: 9,
          h: 4.5
        });
      } catch (imageError) {
        console.error('Error adding title image:', imageError);
        // Continue without the image
      }
    }

    // Add content slides
    presentationData.slides.forEach((slide) => {
      const newSlide = pptx.addSlide();
      
      // Add slide title
      newSlide.addText(slide.title, {
        x: 1,
        y: 0.5,
        w: '80%',
        h: 1,
        fontSize: 32,
        color: '363636',
      });

      // Check if slide has an image
      if (slide.image) {
        try {
          // If there's an image, arrange content and image side by side
          newSlide.addText(slide.content, {
            x: 0.5,
            y: 1.5,
            w: 4.5,
            h: 4,
            fontSize: 18,
            color: '363636',
            breakLine: true,
          });
          
          newSlide.addImage({
            path: slide.image, // Use the URL directly
            x: 5.5,
            y: 1.5,
            w: 4,
            h: 4
          });
        } catch (imageError) {
          console.error(`Error adding image to slide ${slide.title}:`, imageError);
          // If error adding image, revert to full-width content
          newSlide.addText(slide.content, {
            x: 1,
            y: 1.5,
            w: '80%',
            h: 4,
            fontSize: 18,
            color: '363636',
            breakLine: true,
          });
        }
      } else {
        // No image, just use full width for content
        newSlide.addText(slide.content, {
          x: 1,
          y: 1.5,
          w: '80%',
          h: 4,
          fontSize: 18,
          color: '363636',
          breakLine: true,
        });
      }
    });

    // Generate and return the presentation
    return await pptx.write('blob');
  } catch (error) {
    console.error('Error generating presentation:', error);
    throw error;
  }
}; 