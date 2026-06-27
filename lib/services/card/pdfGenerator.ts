import { PDFDocument } from 'pdf-lib';

export async function generateCardPDF(frontImageBuffer: ArrayBuffer, backImageBuffer: ArrayBuffer): Promise<Uint8Array> {
  // Create a new PDFDocument
  const pdfDoc = await PDFDocument.create();

  // Embed the PNG images
  const frontImage = await pdfDoc.embedPng(frontImageBuffer);
  const backImage = await pdfDoc.embedPng(backImageBuffer);

  // Define standard credit card size in points (e.g., CR80: 3.375" x 2.125")
  // Let's use 2.125 x 3.375 inches for portrait. 1 inch = 72 points
  // Width: 2.125 * 72 = 153 points
  // Height: 3.375 * 72 = 243 points
  const cardWidth = 153 * 1.5; // scaling up a bit for better quality/printing
  const cardHeight = 243 * 1.5;

  // Add front page
  const page1 = pdfDoc.addPage([cardWidth, cardHeight]);
  page1.drawImage(frontImage, {
    x: 0,
    y: 0,
    width: cardWidth,
    height: cardHeight,
  });

  // Add back page
  const page2 = pdfDoc.addPage([cardWidth, cardHeight]);
  page2.drawImage(backImage, {
    x: 0,
    y: 0,
    width: cardWidth,
    height: cardHeight,
  });

  // Serialize the PDFDocument to bytes (a Uint8Array)
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
