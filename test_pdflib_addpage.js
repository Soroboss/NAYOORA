const { PDFDocument } = require('pdf-lib');
(async () => {
  try {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([243, 153]);
    console.log("Array worked");
  } catch (e) {
    console.error("Array error:", e.message);
  }
})();
