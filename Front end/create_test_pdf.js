const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument();
const stream = fs.createWriteStream('test_resume.pdf');

doc.pipe(stream);
doc.fontSize(24).text('Test Resume', 100, 100);
doc.fontSize(14).text('John Doe - Python Developer', 100, 150);
doc.fontSize(12).text('Skills:', 100, 200);
doc.fontSize(11).text('Python, React, Node, Express, MongoDB, Docker, AWS, FastAPI, Machine Learning', 100, 220);
doc.end();

stream.on('finish', () => {
  console.log('test_resume.pdf created successfully');
});
