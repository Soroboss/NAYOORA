const { PDFDocument } = require('pdf-lib');
(async () => {
  try {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([243, 153]);
    console.log("PDF-lib addPage worked");
  } catch (e) {
    console.error("PDF-lib error:", e.message);
  }
})();
