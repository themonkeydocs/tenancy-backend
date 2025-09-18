import express from "express";
import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Endpoint testues
app.get("/", (req, res) => {
  res.send("🚀 Serveri po punon!");
});

// Gjenero PDF të thjeshtë
app.post("/generate", async (req, res) => {
  try {
    const { tenantName, landlordName, propertyAddress } = req.body;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

    const { height } = page.getSize();
    page.drawText(`Rental Agreement`, {
      x: 50,
      y: height - 50,
      size: 20,
      font: timesRomanFont,
    });

    page.drawText(`Tenant: ${tenantName}`, { x: 50, y: height - 100, size: 14 });
    page.drawText(`Landlord: ${landlordName}`, { x: 50, y: height - 130, size: 14 });
    page.drawText(`Address: ${propertyAddress}`, { x: 50, y: height - 160, size: 14 });

    const pdfBytes = await pdfDoc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating PDF");
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
