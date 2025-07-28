// Prompt to convert structured input into a search query

import { ChatPromptTemplate } from "@langchain/core/prompts";

export const searchQueryPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a medical insurance assistant. Extract structured data from the user's natural language query.
    
Return JSON in the format:
{
  "age": number,
  "gender": "male" | "female" | "other",
  "procedure": string,
  "location": string,
  "insurance_duration": string
}

If a field is not mentioned, use null.
Do not include extra fields. Only return valid JSON.`
  ],
  ["human", "{input}"]
]);
