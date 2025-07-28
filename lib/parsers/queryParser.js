// Extracts age, gender, procedure, etc. from user input

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { searchQueryPrompt } from "../prompts/searchQueryPrompt.js";
import { StringOutputParser } from "@langchain/core/output_parsers";

const model = new ChatGoogleGenerativeAI({
  modelName: "gemini-pro",
  temperature: 0.2,
  maxOutputTokens: 512,
});

const outputParser = new StringOutputParser();

/**
 * Parses a user’s natural language insurance query into structured fields.
 * @param {string} inputQuery - The user's query in natural language
 * @returns {Promise<object>} - Extracted info as JSON
 */
export const runQueryParseChain = async (inputQuery) => {
  try {
    const chain = searchQueryPrompt.pipe(model).pipe(outputParser);
    const result = await chain.invoke({ input: inputQuery });
    return JSON.parse(result);
  } catch (err) {
    console.error("Query parsing failed:", err);
    throw err;
  }
};
