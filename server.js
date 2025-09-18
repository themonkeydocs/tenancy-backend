import express from "express";
import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// liston template-t
app.get("/templates", (req, res) => {
  const jsonPath = path.join(__dirname, "templates", "contract1.json");
  const tpl = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  res.json(tpl);
});

// gjeneron PDF nga PDF-ja bazë + të dhënat
app.post("/generate/:id", async (req, res) => {
  try {
    const { id } = req.params; // p.sh. contract1
    // PDF bazë pa hapësira në emër
    const pdfPath = path.join(__dirname, "templates", "RentalAgreement.pdf");
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: "Template PDF not found" });
    }

    const existingPdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();
    const first = pages[0];

    // >>> KOORDINATAT – ndryshoji që të bien fiks me PDF-in tënd
    const fontSize = 10;
    const color = rgb(0, 0, 0);

    const put = (text, x, y) =>
      first.drawText(text ?? "", { x, y, size: fontSize, font: helv, color });

    // shembull vendosjesh (ndrysho x,y sipas nevojës)
    const d = req.body || {};
    put(d.tenantName,      120, 700);
    put(d.landlordName,    120, 680);
    put(d.propertyAddress, 120, 660);
    put(d.startDate,       120, 640);
    put(d.endDate,         300, 640);
    put(d.rent,            120, 620);
    put(d.deposit,         300, 620);

    const pdfBytes = await pdfDoc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${id}.pdf"`);
    res.send(Buffer.from(pdfBytes));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Generation failed" });
  }
});

// health
app.get("/health", (req, res) => res.json({ ok: true }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server on", port));
// gjenero kontratën nga contract1.json dhe RentalAgreement.pdf
app.get("/generate/contract1", async (req, res) => {
  try {
    const jsonPath = path.join(__dirname, "templates", "contract1.json");
    const pdfPath = path.join(__dirname, "templates", "RentalAgreement.pdf");

    // lexo JSON me të dhënat
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

    // lexo PDF template
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // font për tekstin
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // shkruaj të dhënat (vendos koordinata sipas nevojës në PDF)
    firstPage.drawText(`Tenant: ${data.tenantName}`, { x: 50, y: 700, size: 12, font });
    firstPage.drawText(`Landlord: ${data.landlordName}`, { x: 50, y: 680, size: 12, font });
    firstPage.drawText(`Address: ${data.propertyAddress}`, { x: 50, y: 660, size: 12, font });
    firstPage.drawText(`Start Date: ${data.startDate}`, { x: 50, y: 640, size: 12, font });
    firstPage.drawText(`End Date: ${data.endDate}`, { x: 50, y: 620, size: 12, font });
    firstPage.drawText(`Rent: ${data.rent}`, { x: 50, y: 600, size: 12, font });
    firstPage.drawText(`Deposit: ${data.deposit}`, { x: 50, y: 580, size: 12, font });

    // ruaj PDF-in e ri
    const modifiedPdf = await pdfDoc.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=GeneratedContract.pdf");
    res.send(Buffer.from(modifiedPdf));
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating contract");
  }
});
