const { PDFDocument } = require('pdf-lib');
(async () => {
  try {
    const pdfDoc = await PDFDocument.create();
    const buf = Buffer.from("");
    await pdfDoc.embedPng(buf);
  } catch (e) {
    console.error("Error from pdf-lib empty buffer:", e.message);
  }
})();
