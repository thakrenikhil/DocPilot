// LLM pipeline for query -> structured JSON

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { extractPrompt } from "../prompts/extractPrompt.js";
import { StringOutputParser } from "@langchain/core/output_parsers";

// LLM Instance
const model = new ChatGoogleGenerativeAI({
  modelName: "gemini-pro",
  temperature: 0.3,
  maxOutputTokens: 1024,
});

const outputParser = new StringOutputParser();

/**
 * Extract structured details from user query using LLM.
 * @param {string} query - User input like “46-year-old male, knee surgery in Pune…”
 * @returns {Promise<object>} Extracted structured data
 */
export const runExtractionChain = async (query) => {
  try {
    const chain = extractPrompt.pipe(model).pipe(outputParser);

    const result = await chain.invoke({ input: query });

    const extractedData = JSON.parse(result);
    return extractedData;
  } catch (err) {
    console.error("Error in Extraction Chain:", err);
    throw err;
  }
};
