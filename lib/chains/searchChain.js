// Converts structured data -> search term

import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { RecursiveCharacterTextSplitter } from "langchain/textsplitters";
import { Document } from "langchain/document";

/**
 * Performs semantic search to find relevant clauses from the document chunks.
 * @param {string} query - Searchable user query (e.g., "knee surgery in Pune").
 * @param {Array<{ pageContent: string, metadata?: any }>} documents - Chunks of the loaded PDF/text.
 * @param {number} topK - Number of relevant chunks to retrieve (default: 3).
 * @returns {Promise<Array>} Top matching document chunks
 */
export const runSearchChain = async (query, documents, topK = 3) => {
  const embeddings = new GoogleGenerativeAIEmbeddings({
    modelName: "text-embedding-004",
  });

  const vectorStore = await MemoryVectorStore.fromDocuments(
    documents.map((doc) => new Document(doc)),
    embeddings
  );

  const results = await vectorStore.similaritySearch(query, topK);
  return results; // each result is a Document: { pageContent, metadata }
};
