import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { TextLoader } from "langchain/document_loaders/fs/text";

export async function loadDocumentsFromUrl(fileUrl) {
  const url = new URL(fileUrl);
  const fileName = url.pathname.split("/").pop() || "";

  let loader;

  if (fileName.endsWith(".pdf")) {
    // Fetch the PDF from the URL and convert to Blob
    const response = await fetch(fileUrl);
    const blob = await response.blob();
    loader = new WebPDFLoader(blob);
  } else if (fileName.endsWith(".txt")) {
    loader = new TextLoader(fileUrl);
  } else {
    throw new Error(`Unsupported file type: ${fileName}`);
  }

  return await loader.load();
}
