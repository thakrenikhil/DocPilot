// import express from 'express';
// import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
// import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
// import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
// import { ChatPromptTemplate } from '@langchain/core/prompts';
// import { JsonOutputParser } from '@langchain/core/output_parsers';
// import { MemoryVectorStore } from 'langchain/vectorstores/memory';
// import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
// import 'dotenv/config';

// const app = express();
// app.use(express.json());

// app.post('/api/query', async (req, res) => {
//   try {
//     const { query } = req.body;
//     if (!query) return res.status(400).json({ error: 'No query provided.' });

//     // 1. Load PDF and split into chunks
//     const loader = new PDFLoader('public/docs/testcase2.pdf');
//     const rawDocs = await loader.load();
//     const splitter = new RecursiveCharacterTextSplitter({
//       chunkSize: 1000,
//       chunkOverlap: 200,
//     });
//     const chunks = await splitter.splitDocuments(rawDocs);

//     // 2. Create vector store from chunks
//     const embeddings = new GoogleGenerativeAIEmbeddings({
//       apiKey: process.env.GOOGLE_API_KEY,
//       modelName: 'text-embedding-004',
//     });
//     const vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);

//     // 3. Extract user data (age, gender, procedure, location, duration)
//     const chatModel = new ChatGoogleGenerativeAI({
//       model: 'gemini-2.5-pro',
//       temperature: 0.2,
//     });
//     const extractPrompt = ChatPromptTemplate.fromMessages([
//       [
//         'system',
//         'Extract age, gender, procedure, location, and policy duration in months from the query. Return JSON with keys: age, gender, procedure, location, policy_duration.',
//       ],
//       ['human', '{input}'],
//     ]);
//     const extractChain = extractPrompt.pipe(chatModel).pipe(new JsonOutputParser());
//     const userData = await extractChain.invoke({ input: query });

//     // 4. Semantic clause search using extracted procedure + policy_duration
//     const searchTerm = `${userData.procedure || ''} ${userData.policy_duration || ''}`.trim();
//     const similarChunks = await vectorStore.similaritySearch(searchTerm, 4);

//     // 5. Decision making based on user data and clauses
//     const decisionPrompt = ChatPromptTemplate.fromMessages([
//       [
//         'system',
//         'You are an insurance assistant. Based on user data and policy clauses, decide if the claim should be approved or rejected. Return JSON with: decision ("approved" or "rejected"), amount (number), and justification (referencing relevant clauses).',
//       ],
//       ['human', 'User Data:\n{userData}\n\nClauses:\n{clauses}'],
//     ]);

//     const decisionChain = decisionPrompt.pipe(chatModel).pipe(new JsonOutputParser());
//     const decision = await decisionChain.invoke({
//       userData: JSON.stringify(userData),
//       clauses: similarChunks.map((c) => c.pageContent).join('\n---\n'),
//     });

//     res.json(decision);
//   } catch (err) {
//     console.error('Error in query pipeline:', err);
//     res.status(500).json({ error: err.message });
//   }
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });


import express from 'express';
import dotenv from 'dotenv';
import router from './app/api/evaluate/route.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
