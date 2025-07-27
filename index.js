// import express from 'express';

// const app = express();


// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));



// app.listen(3000, () => {
//   console.log('Server is running on http://localhost:3000');
// });

import express from 'express';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import 'dotenv/config';
const app = express();
app.use(express.json());

app.post('/api/query', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'No query provided.' });

    // 1. Load and split PDF document
    const loader = new PDFLoader('public/docs/testcase1.pdf');
    const rawDocs = await loader.load();
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
    const chunks = await splitter.splitDocuments(rawDocs);

    // 2. Generate embeddings and create vector store
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY,
      modelName: 'text-embedding-004',
    });
    
    const vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);

    // 3. Extract structured data from the query
    const chatModel = new ChatGoogleGenerativeAI({ 
      model: 'gemini-1.5-flash',
      temperature: 0.2 
    });
    const extractPrompt = ChatPromptTemplate.fromMessages([
      ['system', 'Extract age, gender, procedure, location, and policy duration in months from the query. Return JSON.'],
      ['human', '{input}']
    ]);
    const extractChain = extractPrompt.pipe(chatModel).pipe(new JsonOutputParser());
    const userData = await extractChain.invoke({ input: query });

    // 4. Semantic search based on the procedure and context
    const searchTerm = `${userData.procedure || ''} ${userData.policy_duration || ''}`.trim();
    const similarChunks = await vectorStore.similaritySearch(searchTerm, 4);

    // 5. Ask LLM to evaluate and make decision
    const decisionPrompt = ChatPromptTemplate.fromMessages([
      ['system', 'You are an insurance assistant. Based on user input and clauses, decide if the procedure is covered. Return JSON with these fields: decision (approved or rejected), amount (number), justification (string referencing clauses)'],
      ['human', 'User Data: {userData}\n\nClauses:\n{clauses}']
    ]);

    const decisionChain = decisionPrompt.pipe(chatModel).pipe(new JsonOutputParser());
    const decision = await decisionChain.invoke({
      userData: JSON.stringify(userData),
      clauses: similarChunks.map(c => c.pageContent).join('\n---\n')
    });

    res.json(decision);
  } catch (err) {
    console.error('Error in query pipeline:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});