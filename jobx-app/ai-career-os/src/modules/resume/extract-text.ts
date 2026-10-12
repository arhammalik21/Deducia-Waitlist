import mammoth from "mammoth";

export type ExtractedResumeText = {
  text: string;
  method: "txt" | "docx" | "pdf" | "empty";
};

function isPdf(fileName: string, mimeType: string) {
  return (
    mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf")
  );
}

function isDocx(fileName: string, mimeType: string) {
  return (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.toLowerCase().endsWith(".docx")
  );
}

function isTxt(fileName: string, mimeType: string) {
  return mimeType === "text/plain" || fileName.toLowerCase().endsWith(".txt");
}

function isDoc(fileName: string, mimeType: string) {
  return (
    mimeType === "application/msword" || fileName.toLowerCase().endsWith(".doc")
  );
}

/**
 * Pull plain text from a resume file for AI / heuristic parsing.
 * Scanned PDFs with no text layer return empty — caller should ask the user to fill gaps.
 */
export async function extractResumeText(
  bytes: Buffer,
  fileName: string,
  mimeType: string,
): Promise<ExtractedResumeText> {
  if (isTxt(fileName, mimeType)) {
    return {
      text: bytes.toString("utf8").slice(0, 200_000),
      method: "txt",
    };
  }

  if (isDocx(fileName, mimeType)) {
    const result = await mammoth.extractRawText({ buffer: bytes });
    return {
      text: (result.value || "").trim().slice(0, 200_000),
      method: "docx",
    };
  }

  if (isDoc(fileName, mimeType)) {
    throw new Error(
      "Legacy .doc files are not supported. Please upload PDF, DOCX, or TXT.",
    );
  }

  if (isPdf(fileName, mimeType)) {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    const { text } = await extractText(pdf, { mergePages: true });
    const joined = Array.isArray(text) ? text.join("\n") : String(text ?? "");
    return {
      text: joined.trim().slice(0, 200_000),
      method: "pdf",
    };
  }

  throw new Error("Resume must be a PDF, DOCX, or TXT file.");
}
