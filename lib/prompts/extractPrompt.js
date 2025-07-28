// Prompt for extracting structured info from query

import { ChatPromptTemplate } from "@langchain/core/prompts";

export const extractPrompt = ChatPromptTemplate.fromMessages([
  ["system", "Extract structured data from the following user query. Return a JSON with keys: age, gender, procedure, location, policyDuration."],
  ["human", "{input}"]
]);
