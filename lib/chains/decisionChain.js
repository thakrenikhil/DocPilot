// Final LLM decision pipeline

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { decisionPrompt } from "../prompts/decisionPrompt.js";
import { StringOutputParser } from "@langchain/core/output_parsers";

const model = new ChatGoogleGenerativeAI({
  modelName: "gemini-pro",
  temperature: 0.3,
  maxOutputTokens: 1024,
});

const outputParser = new StringOutputParser();

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
    return JSON.parse(output);
  } catch (error) {
    console.error("Decision chain failed:", error);
    throw error;
  }
};
