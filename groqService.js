import axios from 'axios';

const GROQ_API_ENDPOINT = 'https://api.groq.com/v1/chat/completions';

export const generatePresentationContent = async (topic, numSlides = 5) => {
  try {
    const prompt = `Create a professional presentation outline about "${topic}" with ${numSlides} slides. 
    For each slide, provide a title and detailed content. Format the response as JSON with the following structure:
    {
      "title": "Presentation Title",
      "slides": [
        {
          "title": "Slide Title",
          "content": "Slide content with bullet points and detailed information"
        }
      ]
    }`;

    const response = await axios.post(
      GROQ_API_ENDPOINT,
      {
        model: "llama2-70b-4096",
        messages: [
          {
            role: "system",
            content: "You are a professional presentation creator. Create well-structured, informative presentation content."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const generatedContent = response.data.choices[0].message.content;
    return JSON.parse(generatedContent);
  } catch (error) {
    console.error('Error generating presentation content:', error);
    throw error;
  }
}; 