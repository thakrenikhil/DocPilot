// Main POST handler: receives query & returns JSON decision

import express from 'express';
import { loadDocumentsFromUrl } from '../../../lib/loaders/documentLoader.js';
import { createMemoryStore, searchMemoryStore } from '../../../lib/vectorstore/memoryStore.js';
import { runExtractionChain } from '../../../lib/chains/extractionChain.js';
import { runDecisionChain } from '../../../lib/chains/decisionChain.js';


const router = express.Router();

// Main POST handler: receives query & returns JSON decision
router.post('/api/query', async (req, res) => {
  try {
    const { query, fileUrl } = req.body;

    if (!query || !fileUrl) {
      return res.status(400).json({ error: 'Query and fileUrl are required.' });
    }

    // 1. Load & split documents from file URL (PDF/Doc/Txt)
    const documents = await loadDocumentsFromUrl(fileUrl);

    // 2. Generate vector store from split documents
    const vectorStore = await createMemoryStore(documents);

    // 3. Extract structured information from user query
    const userData = await runExtractionChain(query);

    // 4. Search similar clauses semantically based on procedure and policy duration
    const searchTerm = `${userData.procedure || ''} ${userData.policyDuration || ''}`.trim();
    const clauses = await searchMemoryStore(vectorStore, searchTerm, 4);

    // 5. Evaluate and decide claim approval
    const decision = await runDecisionChain(userData, clauses);

    res.json(decision);
  } catch (err) {
    console.error('Error in /api/query:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
