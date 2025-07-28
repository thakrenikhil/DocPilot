// Loads + splits PDF/DOC/Email into clause-aware chunks

import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';

import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { DocxLoader } from 'langchain/document_loaders/fs/docx';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

/**
 * Downloads a file from a URL and saves it temporarily
 * @param {string} fileUrl - The remote blob/file URL
 * @returns {Promise<string>} - Path to downloaded file
 */
async function downloadFile(fileUrl) {
  const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
  const ext = path.extname(new URL(fileUrl).pathname) || '.pdf';
  const tempFilePath = path.join(tmpdir(), `${uuidv4()}${ext}`);
  await fs.writeFile(tempFilePath, response.data);
  return tempFilePath;
}

/**
 * Loads a file based on its type and returns split chunks
 * @param {string} fileUrl - The Blob/remote file URL
 * @returns {Promise<Array>} - Array of Document chunks
 */
export async function loadDocumentChunks(fileUrl) {
  const filePath = await downloadFile(fileUrl);
  const ext = path.extname(filePath).toLowerCase();

  let loader;
  if (ext === '.pdf') {
    loader = new PDFLoader(filePath);
  } else if (ext === '.docx') {
    loader = new DocxLoader(filePath);
  } else if (ext === '.txt') {
    loader = new TextLoader(filePath);
  } else {
    throw new Error(`Unsupported file type: ${ext}`);
  }

  const rawDocs = await loader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const chunks = await splitter.splitDocuments(rawDocs);
  return chunks;
}
