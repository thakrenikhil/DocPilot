// Final LLM decision pipeline

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { decisionPrompt } from "../prompts/decisionPrompt.js";
import { StringOutputParser } from "@langchain/core/output_parsers";

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
  console.log("Raw response:", response);
  
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
  
  console.log("Cleaned response:", cleaned);
  return cleaned;
}

/**
 * Create a fallback response when JSON parsing fails
 * @param {string} rawOutput - The raw output from the LLM
 * @returns {object} A structured fallback response
 */
function createFallbackResponse(rawOutput) {
  // Try to extract key information from the raw output
  const decisionMatch = rawOutput.match(/decision["\s]*:["\s]*([^",\n}]+)/i);
  const amountMatch = rawOutput.match(/amount["\s]*:["\s]*(\d+)/i);
  const justificationMatch = rawOutput.match(/justification["\s]*:["\s]*([^"]+)/i);
  
  return {
    decision: decisionMatch ? decisionMatch[1].trim().toLowerCase() : "deny",
    amount: amountMatch ? parseInt(amountMatch[1]) : 0,
    justification: justificationMatch ? justificationMatch[1].trim() : "Unable to parse response properly"
  };
}

/**
 * Evaluate claim decision using LLM and relevant clauses.
 * @param {object} extractedData - Extracted info from user query (e.g., age, procedure, etc.)
 * @param {Array} relevantClauses - Array of top matching chunks from semantic search
 * @returns {Promise<object>} JSON with decision, amount, justification
 */
export const runDecisionChain = async (extractedData, relevantClauses) => {
  const input = {
    input: JSON.stringify({
      extractedData,
      clauses: relevantClauses.map((doc) => doc.pageContent),
    }),
  };

  try {
    const chain = decisionPrompt.pipe(model).pipe(outputParser);
    const output = await chain.invoke(input);
    const cleanedOutput = cleanJsonResponse(output);
    
    try {
      return JSON.parse(cleanedOutput);
    } catch (parseError) {
      console.error("JSON parsing failed, using fallback:", parseError);
      console.error("Failed to parse:", cleanedOutput);
      return createFallbackResponse(output);
    }
  } catch (error) {
    console.error("Decision chain failed:", error);
    if (typeof output !== 'undefined') {
      console.error("Raw output:", output);
      return createFallbackResponse(output);
    }
    throw error;
  }
};
