import { jsPDF } from "jspdf";

/** Render plain text into a multi-page A4 PDF (UTF-8 content; Latin-focused default font). */
export function textContentToPdfBlob(text: string): Blob {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - margin * 2;
  const lineHeight = 13;
  const normalized = text.replace(/\r\n/g, "\n");
  const lines = doc.splitTextToSize(normalized, maxWidth);
  let y = margin;

  for (const line of lines) {
    if (y > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += lineHeight;
  }

  return doc.output("blob");
}

/** Safe download basename ending in `.pdf` from a stored GridFS-style filename */
export function caseFileDownloadPdfName(storedFilename: string): string {
  const withoutSuffix = storedFilename
    .replace(/\.clean\.txt$/i, "")
    .replace(/\.txt$/i, "");
  const safe = withoutSuffix.replace(/[/\\?%*:|"<>]/g, "_").trim() || "case-file";
  return `${safe}.pdf`;
}
