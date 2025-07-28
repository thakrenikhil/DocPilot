Large Language Models (LLMs) to process natural language queries and retrieve relevant information from large unstructured documents such as policy documents, contracts, and emails.

# Creating a summary text file describing the context and working of the application

context = """
# Insurance Claim Evaluation System using Gemini LLM

## Overview
This application processes natural language insurance queries and evaluates whether a procedure is covered under a policy. It utilizes Google Gemini LLM APIs (not OpenAI) for query understanding, document embedding, and claim decision-making. The system works entirely in-memory using LangChain.

---

## Pipeline Flow

1. **Document Loader**
   - Accepts PDFs, DOCX, TXT via Blob URLs.
   - Extracts and chunks documents using RecursiveCharacterTextSplitter.

2. **Memory Store (Vector DB)**
   - Chunks are converted into vector embeddings using `GoogleGenerativeAIEmbeddings`.
   - Stored in an in-memory vector store (`MemoryVectorStore`).

3. **Extraction Chain**
   - Parses natural language queries to extract structured info:
     - `age`, `gender`, `procedure`, `location`, `policy_duration`.
   - Uses `ChatGoogleGenerativeAI` with prompt + JSON parser.

4. **Semantic Search**
   - Constructs a search query based on procedure & policy duration.
   - Performs similarity search on the memory store to retrieve relevant clauses.

5. **Decision Chain**
   - Takes structured user data + retrieved clauses.
   - Uses Gemini to decide whether the procedure is covered.
   - Returns structured JSON:
     - `decision` (approved/rejected)
     - `amount`
     - `justification` (based on retrieved clauses)

---

## Folder Structure

- `/lib/loaders/documentLoader.js` → Loads files from blob URLs
- `/lib/chains/extractionChain.js` → Extracts structured fields
- `/lib/chains/searchChain.js` → Performs semantic search
- `/lib/chains/decisionChain.js` → Evaluates claim decision
- `/lib/prompts/queryParse.js` → System & human prompt for field extraction
- `/lib/prompts/searchQueryPrompt.js` → Constructs search terms
- `/lib/memory/memoryStore.js` → In-memory vector DB setup and search

---

## Dependencies

- `express`
- `dotenv`
- `@langchain/community`
- `@langchain/google-genai`
- `langchain`

---

## API Endpoint

### POST `/api/query`

#### Input:
```json
{
  "query": "46-year-old male, knee surgery in Pune, 3-month-old insurance"
}
