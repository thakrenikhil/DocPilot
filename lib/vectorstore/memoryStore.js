// Embedding + in-memory vector store setup

import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

/**
 * Initialize in-memory vector store from document chunks.
 * @param {Array} docs - List of LangChain document chunks
 * @returns {Promise<MemoryVectorStore>} - The vector store ready for similarity search
 */
export const createMemoryStore = async (docs) => {
  const embeddings = new GoogleGenerativeAIEmbeddings({
    modelName: "text-embedding-004",
    apiKey: process.env.GOOGLE_API_KEY,
  });

  const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
  return vectorStore;
};

/**
 * Search similar documents from a given vector store
 * @param {MemoryVectorStore} store - The initialized memory vector store
 * @param {string} searchTerm - The search query (e.g., procedure, duration)
 * @param {number} k - Number of similar chunks to retrieve
 * @returns {Promise<Array>} - Top-k similar document chunks
 */
export const searchMemoryStore = async (store, searchTerm, k = 4) => {
  const results = await store.similaritySearch(searchTerm, k);
  return results;
};
