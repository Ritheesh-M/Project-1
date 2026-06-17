const pdfParse = require("pdf-parse");

console.log("pdf-parse exports:");
console.log("typeof pdfParse:", typeof pdfParse);
console.log("pdfParse.default:", typeof pdfParse.default);
console.log("pdfParse:", pdfParse);

// Try to understand the structure
if (typeof pdfParse === 'object') {
  console.log("Keys:", Object.keys(pdfParse));
}
