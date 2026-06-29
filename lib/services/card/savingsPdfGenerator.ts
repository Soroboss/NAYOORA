import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';

export async function generateSavingsCardPDF(data: {
  orgName: string;
  memberName: string;
  productName: string;
  contributionAmount: number;
  durationDays: number;
  expectedAmount: number;
  cardId: string;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  // A6 size in points (approx 298 x 420)
  const page = pdfDoc.addPage([298, 420]);
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Generate QR Code Buffer
  const qrUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify/savings/${data.cardId}`;
  const qrBuffer = await QRCode.toBuffer(qrUrl, { margin: 1, width: 60 });
  const qrImage = await pdfDoc.embedPng(qrBuffer);

  // Draw Header
  page.drawText(data.orgName, { x: 15, y: 400, size: 14, font: fontBold, color: rgb(0.1, 0.2, 0.5) });
  page.drawText("CARNET D'ÉPARGNE", { x: 15, y: 385, size: 10, font: font, color: rgb(0.3, 0.3, 0.3) });

  // Draw QR Code
  page.drawImage(qrImage, { x: 298 - 15 - 60, y: 420 - 15 - 60, width: 60, height: 60 });

  // Draw Member and Product Info
  page.drawText(`Membre : ${data.memberName}`, { x: 15, y: 350, size: 12, font: fontBold });
  page.drawText(`Produit : ${data.productName}`, { x: 15, y: 335, size: 10, font });
  page.drawText(`Cotisation : ${data.contributionAmount} FCFA / jour`, { x: 15, y: 320, size: 10, font });
  page.drawText(`Objectif total : ${data.expectedAmount} FCFA`, { x: 15, y: 305, size: 10, font: fontBold });

  // Draw the tracking grid (e.g. 5 columns x rows)
  const cols = 5;
  const rows = Math.ceil(data.durationDays / cols);
  
  const startX = 15;
  const startY = 270;
  const cellWidth = 53;
  const cellHeight = 30;

  for (let i = 0; i < data.durationDays; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    
    const x = startX + col * cellWidth;
    const y = startY - row * cellHeight;

    // Draw box
    page.drawRectangle({
      x, y: y - cellHeight, width: cellWidth, height: cellHeight,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
    });

    // Draw day number
    page.drawText(`J${i + 1}`, {
      x: x + 2, y: y - 10, size: 8, font, color: rgb(0.5, 0.5, 0.5)
    });
  }

  // Footer
  page.drawText("Carnet à présenter lors du pointage.", { x: 15, y: startY - rows * cellHeight - 30, size: 9, font, color: rgb(0.5, 0.5, 0.5) });
  
  return await pdfDoc.save();
}
