// Debug version with comprehensive logging

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { decisionPrompt } from "../prompts/decisionPrompt.js";
import { StringOutputParser } from "@langchain/core/output_parsers";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash", // Changed from gemini-2.5-pro which might not exist
  temperature: 0.3,
  maxOutputTokens: 512,
  apiKey: process.env.GOOGLE_API_KEY,
});

const outputParser = new StringOutputParser();

/**
 * Debug function to check API key and model configuration
 */
function debugConfiguration() {
  console.log("=== Configuration Debug ===");
  console.log("API Key exists:", !!process.env.GOOGLE_API_KEY);
  console.log("API Key length:", process.env.GOOGLE_API_KEY?.length || 0);
  console.log("Model configuration:", {
    model: model.model,
    temperature: model.temperature,
    maxOutputTokens: model.maxOutputTokens
  });
}

/**
 * Test the model with a simple prompt
 */
async function testModelConnection() {
  console.log("=== Testing Model Connection ===");
  try {
    const testChain = model.pipe(outputParser);
    const testResponse = await testChain.invoke("Say 'Hello, I am working!' in JSON format: {\"status\": \"working\", \"message\": \"Hello, I am working!\"}");
    console.log("Test response:", testResponse);
    return true;
  } catch (error) {
    console.error("Model test failed:", error.message);
    console.error("Error details:", error);
    return false;
  }
}

/**
 * Clean JSON response by removing markdown code blocks and extra whitespace
 */
function cleanJsonResponse(response) {
  console.log("Raw response:", response);
  console.log("Response type:", typeof response);
  console.log("Response length:", response?.length || 0);
  
  if (!response || typeof response !== 'string' || response.trim() === '') {
    console.log("Empty or invalid response received");
    return null;
  }
  
  let cleaned = response.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
  cleaned = cleaned.trim();
  
  if (cleaned === '') {
    console.log("Response is empty after cleaning markdown");
    return null;
  }
  
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  } else {
    console.log("No JSON object found in response");
    return null;
  }
  
  // Fix common JSON issues
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  
  console.log("Cleaned response:", cleaned);
  return cleaned;
}

/**
 * Create a fallback response when JSON parsing fails
 */
function createFallbackResponse(rawOutput) {
  if (!rawOutput || typeof rawOutput !== 'string') {
    return {
      decision: "deny",
      amount: 0,
      justification: "No valid response received from AI model"
    };
  }

  const decisionMatch = rawOutput.match(/decision["\s]*:["\s]*([^",\n}]+)/i);
  const amountMatch = rawOutput.match(/amount["\s]*:["\s]*(\d+)/i);
  const justificationMatch = rawOutput.match(/justification["\s]*:["\s]*([^"]+)/i);
  
  return {
    decision: decisionMatch ? decisionMatch[1].trim().toLowerCase() : "deny",
    amount: amountMatch ? parseInt(amountMatch[1]) : 0,
    justification: justificationMatch ? justificationMatch[1].trim() : "Unable to parse response properly. Raw output available for manual review."
  };
}

/**
 * Validate the parsed decision object
 */
function validateDecision(decision) {
  const validDecisions = ['approve', 'deny', 'pending'];
  
  return {
    decision: validDecisions.includes(decision.decision?.toLowerCase()) 
      ? decision.decision.toLowerCase() 
      : 'deny',
    amount: typeof decision.amount === 'number' && decision.amount >= 0 
      ? decision.amount 
      : 0,
    justification: typeof decision.justification === 'string' && decision.justification.trim() 
      ? decision.justification.trim() 
      : 'No justification provided'
  };
}

/**
 * Evaluate claim decision using LLM and relevant clauses.
 */
export const runDecisionChain = async (extractedData, relevantClauses) => {
  console.log("=== Starting Decision Chain ===");
  
  // Debug configuration
  debugConfiguration();
  
  // Test model connection first
  const isModelWorking = await testModelConnection();
  if (!isModelWorking) {
    console.error("Model connection failed, returning fallback");
    return validateDecision({
      decision: "deny",
      amount: 0,
      justification: "AI model connection failed. Please check API key and model configuration."
    });
  }
  
  const input = {
    input: JSON.stringify({
      extractedData,
      clauses: relevantClauses.map((doc) => doc.pageContent),
    }),
  };

  console.log("Input data:", JSON.stringify(input, null, 2));

  let output = '';

  try {
    console.log("=== Invoking Decision Chain ===");
    const chain = decisionPrompt.pipe(model).pipe(outputParser);
    
    console.log("Chain created successfully");
    console.log("Sending request to model...");
    
    output = await chain.invoke(input);
    
    console.log("=== Model Response Received ===");
    console.log("LLM Output:", output);
    console.log("Output type:", typeof output);
    console.log("Output length:", output?.length || 0);
    
    if (!output) {
      console.error("Model returned empty response");
      return validateDecision(createFallbackResponse(output));
    }
    
    const cleanedOutput = cleanJsonResponse(output);
    
    if (cleanedOutput === null) {
      console.log("Failed to clean JSON, using fallback");
      return validateDecision(createFallbackResponse(output));
    }
    
    console.log("=== Attempting JSON Parse ===");
    try {
      const parsedDecision = JSON.parse(cleanedOutput);
      console.log("Successfully parsed decision:", parsedDecision);
      return validateDecision(parsedDecision);
    } catch (parseError) {
      console.error("JSON parsing failed:", parseError.message);
      console.error("Failed to parse:", cleanedOutput);
      return validateDecision(createFallbackResponse(output));
    }
    
  } catch (error) {
    console.error("=== Decision Chain Error ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Error details:", error);
    
    if (output) {
      console.log("Attempting fallback with available output");
      return validateDecision(createFallbackResponse(output));
    }
    
    return validateDecision({
      decision: "deny",
      amount: 0,
      justification: `System error: ${error.message}. Please review manually.`
    });
  }
};