// LLM pipeline for query -> structured JSON

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { extractPrompt } from "../prompts/extractPrompt.js";
import { StringOutputParser } from "@langchain/core/output_parsers";
import 'dotenv/config';
// LLM Instance
const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-pro",
  temperature: 0.3,
  maxOutputTokens: 1024,
  apiKey: process.env.GOOGLE_API_KEY,
});

const outputParser = new StringOutputParser();

/**
 * Clean JSON response by removing markdown code blocks and extra whitespace
 * @param {string} response - Raw response from LLM
 * @returns {string} Cleaned JSON string
 */
function cleanJsonResponse(response) {
  console.log("Raw extraction response:", response);
  
  // Remove markdown code blocks
  let cleaned = response.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
  
  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim();
  
  // Try to extract JSON from the response
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }
  
  // If the response doesn't start with {, try to find the first {
  if (!cleaned.startsWith('{')) {
    const firstBrace = cleaned.indexOf('{');
    if (firstBrace !== -1) {
      cleaned = cleaned.substring(firstBrace);
    }
  }
  
  // If the response doesn't end with }, try to find the last }
  if (!cleaned.endsWith('}')) {
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace !== -1) {
      cleaned = cleaned.substring(0, lastBrace + 1);
    }
  }
  
  // Try to fix common JSON issues
  // Remove any trailing commas before closing braces
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  
  // Ensure all strings are properly closed
  // This is a simple fix - in practice, you might need more sophisticated parsing
  const quoteCount = (cleaned.match(/"/g) || []).length;
  if (quoteCount % 2 !== 0) {
    // Odd number of quotes, try to add a closing quote at the end
    if (cleaned.endsWith('}')) {
      cleaned = cleaned.slice(0, -1) + '"}';
    }
  }
  
  console.log("Cleaned extraction response:", cleaned);
  return cleaned;
}

/**
 * Create a fallback response when JSON parsing fails for extraction
 * @param {string} rawOutput - The raw output from the LLM
 * @returns {object} A structured fallback response
 */
function createFallbackExtractionResponse(rawOutput) {
  // Try to extract key information from the raw output
  const ageMatch = rawOutput.match(/age["\s]*:["\s]*(\d+)/i);
  const genderMatch = rawOutput.match(/gender["\s]*:["\s]*([^",\n}]+)/i);
  const procedureMatch = rawOutput.match(/procedure["\s]*:["\s]*([^",\n}]+)/i);
  const locationMatch = rawOutput.match(/location["\s]*:["\s]*([^",\n}]+)/i);
  const durationMatch = rawOutput.match(/policyDuration["\s]*:["\s]*([^",\n}]+)/i);
  
  return {
    age: ageMatch ? parseInt(ageMatch[1]) : null,
    gender: genderMatch ? genderMatch[1].trim().toLowerCase() : null,
    procedure: procedureMatch ? procedureMatch[1].trim() : null,
    location: locationMatch ? locationMatch[1].trim() : null,
    policyDuration: durationMatch ? durationMatch[1].trim() : null
  };
}

/**
 * Extract structured details from user query using LLM.
 * @param {string} query - User input like "46-year-old male, knee surgery in Pune…"
 * @returns {Promise<object>} Extracted structured data
 */
export const runExtractionChain = async (query) => {
  try {
    const chain = extractPrompt.pipe(model).pipe(outputParser);

    const result = await chain.invoke({ input: query });

    const cleanedResult = cleanJsonResponse(result);
    
    try {
      const extractedData = JSON.parse(cleanedResult);
      return extractedData;
    } catch (parseError) {
      console.error("JSON parsing failed for extraction, using fallback:", parseError);
      console.error("Failed to parse:", cleanedResult);
      return createFallbackExtractionResponse(result);
    }
  } catch (err) {
    console.error("Error in Extraction Chain:", err);
    if (typeof result !== 'undefined') {
      console.error("Raw result:", result);
      return createFallbackExtractionResponse(result);
    }
    throw err;
  }
};
