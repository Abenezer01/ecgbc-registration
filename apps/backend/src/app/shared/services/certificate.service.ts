import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import QRCode from 'qrcode';
import fs from 'fs/promises';
import path from 'path';
import prisma from '../../config/db.config';
import { DESTINANTIONS } from '../../config/multer.config';
import { v4 as uuidv4 } from "uuid";
import { certificateTemplate } from '../templates/certificate.template';

export class CertificateService {
  static async generateMemberCertificate(memberId: string, previewOnly: boolean = false): Promise<any> {
    let browser = null;
    try {
      const member = await prisma.member.findUnique({
        where: { id: memberId },
        include: { councilFellowship: true, region: true },
      });
      if (!member) throw new Error(`Member with ID ${memberId} not found.`);

      // Paths
      const fontPath = path.join(__dirname, '../../../../public/fonts/AmharicFont.ttf');

      // Load Font as Base64 for the HTML template
      let base64Font = '';
      try {
        const fontBytes = await fs.readFile(fontPath);
        base64Font = fontBytes.toString('base64');
      } catch (err) {
        console.warn(`Font not found at ${fontPath}. Proceeding without custom font.`);
      }

      // Generate QR Code
      const verificationUrl = `https://ecgbc.org/verify/${member.certificateNo}`;
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, color: { dark: '#003366', light: '#FFFFFF' } });

      // Compile Handlebars template
      const template = Handlebars.compile(certificateTemplate);
      
      const issueDate = member.certificateIssuedDate ? new Date(member.certificateIssuedDate) : new Date();
      
      // Amharic Date (Simplified: use Gregorian for now, or adapt later if EthiopianCalendar is available in scope)
      const issueDateAmh = issueDate.getDate();
      const issueYearAmh = issueDate.getFullYear();
      
      // English Date
      const issueDayEng = issueDate.getDate();
      const issueMonthYearEng = `${issueDate.toLocaleString('default', { month: 'long' })} ${issueDate.getFullYear()}`;

      const htmlContent = template({
        base64Font,
        member: {
          name: member.name,
          nameEn: member.nameEn || "",
          certificateNo: member.certificateNo,
        },
        issueDateAmh,
        issueYearAmh,
        issueDayEng,
        issueMonthYearEng,
        qrCodeBase64: qrCodeDataUrl,
        logoBase64: "" // TODO: Add real logo base64 here if available
      });

      // Launch Puppeteer with CI-safe flags
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // Generate PDF (A4 Landscape)
      const pdfBytes = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' }
      });

      if (previewOnly) {
        return pdfBytes;
      }

      // Save to disk
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
      return newFile;
    } catch (error: any) {
      console.warn('Puppeteer failed (likely missing Chrome binary). Falling back to pdf-lib...', error.message);
      if (browser) {
        await browser.close().catch(() => {});
      }
      return this.generateWithPdfLibFallback(memberId, previewOnly);
    }
  }

  private static async generateWithPdfLibFallback(memberId: string, previewOnly: boolean): Promise<any> {
    const { PDFDocument, rgb } = await import('pdf-lib');
    const fontkit = (await import('@pdf-lib/fontkit')).default;
    
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: { councilFellowship: true, region: true },
    });
    if (!member) throw new Error(`Member with ID ${memberId} not found.`);

    const fontPath = path.join(__dirname, '../../../../public/fonts/AmharicFont.ttf');

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([841.89, 595.28]);
    const { width, height } = page.getSize();
    
    let fontBytes: Buffer;
    try {
      fontBytes = await fs.readFile(fontPath);
    } catch (err) {
      throw new Error(`Font not found at ${fontPath}.`);
    }

    pdfDoc.registerFontkit(fontkit);
    const customFont = await pdfDoc.embedFont(fontBytes);

    const goldColor = rgb(0.85, 0.65, 0.13); 
    const darkBlueColor = rgb(0.0, 0.2, 0.4); 
    const blackColor = rgb(0, 0, 0);

    // Borders
    page.drawRectangle({ x: 30, y: 30, width: width - 60, height: height - 60, borderColor: goldColor, borderWidth: 4 });
    page.drawRectangle({ x: 38, y: 38, width: width - 76, height: height - 76, borderColor: darkBlueColor, borderWidth: 1 });
    page.drawRectangle({ x: 42, y: 42, width: width - 84, height: height - 84, borderColor: goldColor, borderWidth: 2 });

    const drawCenteredText = (text: string, y: number, size: number, color: any) => {
      const textWidth = customFont.widthOfTextAtSize(text, size);
      page.drawText(text, { x: (width - textWidth) / 2, y, size, font: customFont, color });
    };

    drawCenteredText("የኢትዮጵያ ወንጌል አማኞች አብያተ ክርስቲያናት ካውንስል", height - 100, 24, darkBlueColor);
    drawCenteredText("Ethiopian Council of Gospel believers' Churches", height - 130, 18, darkBlueColor);
    
    page.drawLine({ start: { x: width / 2 - 150, y: height - 150 }, end: { x: width / 2 + 150, y: height - 150 }, thickness: 2, color: goldColor });

    drawCenteredText("የምዝገባ የምስክር ወረቀት", height - 200, 32, goldColor);
    drawCenteredText("CERTIFICATE OF REGISTRATION", height - 235, 22, goldColor);

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

    page.drawText("የምስክር ወረቀት ቁጥር / No:", { x: labelX, y: height - 400, size: 16, font: customFont, color: blackColor });
    page.drawText(certNo, { x: valueX, y: height - 400, size: 18, font: customFont, color: darkBlueColor });

    page.drawText("የተሰጠበት ቀን / Date:", { x: labelX, y: height - 450, size: 16, font: customFont, color: blackColor });
    page.drawText(issuedDate, { x: valueX, y: height - 450, size: 18, font: customFont, color: darkBlueColor });

    page.drawLine({ start: { x: 150, y: 100 }, end: { x: 350, y: 100 }, thickness: 1, color: blackColor });
    page.drawText("ፕሬዝዳንት / President", { x: 200, y: 75, size: 12, font: customFont, color: blackColor });

    page.drawLine({ start: { x: 490, y: 100 }, end: { x: 690, y: 100 }, thickness: 1, color: blackColor });
    page.drawText("ዋና ፀሀፊ / General Secretary", { x: 520, y: 75, size: 12, font: customFont, color: blackColor });

    const verificationUrl = `https://ecgbc.org/verify/${member.certificateNo}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, color: { dark: '#003366', light: '#FFFFFF' } });
    const qrImageBytes = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
    const qrImage = await pdfDoc.embedPng(qrImageBytes);
    const qrDims = qrImage.scale(0.5);
    
    page.drawImage(qrImage, { x: width - 150, y: height - 170, width: qrDims.width, height: qrDims.height });

    const pdfBytes = await pdfDoc.save();
    
    if (previewOnly) {
      return Buffer.from(pdfBytes);
    }

    const fileName = `Certificate_${member.certificateNo}_${uuidv4()}.pdf`;
    const saveDir = path.join(__dirname, '../../config', DESTINANTIONS.FILE.FILE);
    await fs.mkdir(saveDir, { recursive: true });
    await fs.writeFile(path.join(saveDir, fileName), pdfBytes);

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
  }
}
