import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import QRCode from 'qrcode';
import fs from 'fs/promises';
import path from 'path';
import prisma from '../../config/db.config';
import { DESTINANTIONS } from '../../config/multer.config';
import { v4 as uuidv4 } from "uuid";

export class CertificateService {
  static async generateMemberCertificate(memberId: string): Promise<any> {
    try {
      const member = await prisma.member.findUnique({
        where: { id: memberId },
        include: { councilFellowship: true, region: true },
      });
      if (!member) throw new Error(`Member with ID ${memberId} not found.`);

      const fontPath = path.join(__dirname, '../../../../public/fonts/AmharicFont.ttf');

      // Create a new PDF document (A4 Landscape)
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([841.89, 595.28]);
      const { width, height } = page.getSize();
      
      // Fonts
      let fontBytes: Buffer;
      try {
        fontBytes = await fs.readFile(fontPath);
      } catch (err) {
        console.warn(`Font not found at ${fontPath}.`);
        return null; 
      }

      pdfDoc.registerFontkit(fontkit);
      const customFont = await pdfDoc.embedFont(fontBytes);

      // Colors
      const goldColor = rgb(0.85, 0.65, 0.13); // Goldenrod
      const darkBlueColor = rgb(0.0, 0.2, 0.4); // Dark blue text
      const blackColor = rgb(0, 0, 0);

      // ── Borders ─────────────────────────────────────────────────────────────
      // Outer Gold Border
      page.drawRectangle({
        x: 30, y: 30, width: width - 60, height: height - 60,
        borderColor: goldColor, borderWidth: 4,
      });

      // Inner Dark Blue Border
      page.drawRectangle({
        x: 38, y: 38, width: width - 76, height: height - 76,
        borderColor: darkBlueColor, borderWidth: 1,
      });
      
      // Inner Gold Border
      page.drawRectangle({
        x: 42, y: 42, width: width - 84, height: height - 84,
        borderColor: goldColor, borderWidth: 2,
      });

      // ── Helper to center text ───────────────────────────────────────────────
      const drawCenteredText = (text: string, y: number, size: number, color: any) => {
        const textWidth = customFont.widthOfTextAtSize(text, size);
        page.drawText(text, { x: (width - textWidth) / 2, y, size, font: customFont, color });
      };

      // ── Headers ─────────────────────────────────────────────────────────────
      const titleAmh = "የኢትዮጵያ ክርስቲያን ወንጌል አማኞች አብያተ ክርስቲያናት ካውንስል";
      const titleEng = "Ethiopian Christian Gospel Believers Churches Council";
      const certTitleAmh = "የምዝገባ ምስክር ወረቀት";
      const certTitleEng = "CERTIFICATE OF REGISTRATION";

      drawCenteredText(titleAmh, height - 100, 24, darkBlueColor);
      drawCenteredText(titleEng, height - 130, 18, darkBlueColor);
      
      // Decorative Divider
      page.drawLine({
        start: { x: width / 2 - 150, y: height - 150 },
        end: { x: width / 2 + 150, y: height - 150 },
        thickness: 2, color: goldColor,
      });

      drawCenteredText(certTitleAmh, height - 200, 32, goldColor);
      drawCenteredText(certTitleEng, height - 235, 22, goldColor);

      // ── Member Details ──────────────────────────────────────────────────────
      const nameAmh = member.name;
      const nameEng = member.nameEn || "";
      const certNo = member.certificateNo;
      const issuedDate = member.certificateIssuedDate ? new Date(member.certificateIssuedDate).toLocaleDateString() : new Date().toLocaleDateString();

      const labelX = 120;
      const valueX = 300;

      page.drawText("ስም / Name:", { x: labelX, y: height - 310, size: 16, font: customFont, color: blackColor });
      page.drawText(nameAmh, { x: valueX, y: height - 310, size: 20, font: customFont, color: darkBlueColor });
      
      if (nameEng) {
        page.drawText(nameEng, { x: valueX, y: height - 340, size: 16, font: customFont, color: darkBlueColor });
      }

      page.drawText("የምስክር ወረቀት ቁጥር /", { x: labelX, y: height - 390, size: 16, font: customFont, color: blackColor });
      page.drawText("Certificate No:", { x: labelX, y: height - 410, size: 16, font: customFont, color: blackColor });
      page.drawText(certNo, { x: valueX, y: height - 400, size: 18, font: customFont, color: darkBlueColor });

      page.drawText("የተሰጠበት ቀን / Date:", { x: labelX, y: height - 450, size: 16, font: customFont, color: blackColor });
      page.drawText(issuedDate, { x: valueX, y: height - 450, size: 18, font: customFont, color: darkBlueColor });

      // ── Signatures ──────────────────────────────────────────────────────────
      // President Signature
      page.drawLine({ start: { x: 150, y: 100 }, end: { x: 350, y: 100 }, thickness: 1, color: blackColor });
      page.drawText("ፕሬዝዳንት / President", { x: 200, y: 75, size: 12, font: customFont, color: blackColor });

      // General Secretary Signature
      page.drawLine({ start: { x: 490, y: 100 }, end: { x: 690, y: 100 }, thickness: 1, color: blackColor });
      page.drawText("ዋና ፀሀፊ / General Secretary", { x: 520, y: 75, size: 12, font: customFont, color: blackColor });

      // ── QR Code ─────────────────────────────────────────────────────────────
      const verificationUrl = `https://ecgbc.org/verify/${member.certificateNo}`;
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, color: { dark: '#003366', light: '#FFFFFF' } });
      const qrImageBytes = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
      const qrImage = await pdfDoc.embedPng(qrImageBytes);
      const qrDims = qrImage.scale(0.5);
      
      page.drawImage(qrImage, {
        x: width - 150,
        y: height - 170,
        width: qrDims.width,
        height: qrDims.height,
      });

      // ── Save ────────────────────────────────────────────────────────────────
      const pdfBytes = await pdfDoc.save();
      const fileName = `Certificate_${member.certificateNo}_${uuidv4()}.pdf`;
      const saveDir = path.join(__dirname, '../../config', DESTINANTIONS.FILE.FILE);
      await fs.mkdir(saveDir, { recursive: true });
      await fs.writeFile(path.join(saveDir, fileName), pdfBytes);

      // Save to DB
      const category = await prisma.dataLookup.findFirst({
        where: { value: 'CERTIFICATE_AND_LETTER', category: 'FILE_TYPE' },
      });

      const newFile = await (prisma as any).file.create({
        data: {
          memberId: member.id,
          councilFellowshipId: member.councilFellowshipId,
          fileName: fileName,
          file: fileName,
          categoryId: category?.id || null,
        },
      });

      return newFile;
    } catch (error) {
      console.error('Error generating certificate:', error);
      return null;
    }
  }
}
