import puppeteer from 'puppeteer';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
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
  const englishFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const englishFontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const goldColor = rgb(0.85, 0.65, 0.13); 
  const darkBlueColor = rgb(0.0, 0.2, 0.4); 
  const blackColor = rgb(0, 0, 0);

  // Borders
  page.drawRectangle({ x: 30, y: 30, width: width - 60, height: height - 60, borderColor: goldColor, borderWidth: 4 });
  page.drawRectangle({ x: 38, y: 38, width: width - 76, height: height - 76, borderColor: darkBlueColor, borderWidth: 1 });
  page.drawRectangle({ x: 42, y: 42, width: width - 84, height: height - 84, borderColor: goldColor, borderWidth: 2 });

  const drawCenteredText = (text: string, y: number, size: number, color: any, font: any) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - textWidth) / 2, y, size, font, color });
  };

  // Header
  drawCenteredText("የኢትዮጵያ ወንጌል አማኞች አብያተ ክርስቲያናት ካውንስል", height - 100, 24, darkBlueColor, customFont);
  drawCenteredText("Ethiopian Council of Gospel believers' Churches", height - 130, 18, darkBlueColor, englishFontBold);
  
  page.drawLine({ start: { x: width / 2 - 150, y: height - 150 }, end: { x: width / 2 + 150, y: height - 150 }, thickness: 2, color: goldColor });

  drawCenteredText("የምዝገባ የምስክር ወረቀት", height - 200, 32, goldColor, customFont);
  drawCenteredText("CERTIFICATE OF REGISTRATION", height - 235, 22, goldColor, englishFontBold);

  // Layout Constants
  const leftColX = 100;
  const rightColX = 430;
  const colStartY = height - 310;
  const lineSpacing = 26;

  const nameAmh = member.name || "";
  const nameEng = member.nameEn || "";
  const certNo = member.certificateNo || "";
  const issueDate = member.certificateIssuedDate ? new Date(member.certificateIssuedDate) : new Date();

  // Left Column - Amharic
  page.drawText("በኢትዮጵያ ወንጌል አማኞች አብያተ ክርስቲያናት ካውንስል አባላት ሕጋዊ ሰውነት", { x: leftColX, y: colStartY, size: 12, font: customFont, color: blackColor });
  page.drawText("ለመስጠት በወጣው አዋጅ ቁጥር 1208/2012 መሠረት ይህ የሕጋዊ ሰውነት", { x: leftColX, y: colStartY - lineSpacing, size: 12, font: customFont, color: blackColor });
  
  // Amh Line 3
  const amhL3Text = "ማረጋገጫ የምስክር ወረቀት ለ ";
  const amhL3W = customFont.widthOfTextAtSize(amhL3Text, 12);
  page.drawText(amhL3Text, { x: leftColX, y: colStartY - (lineSpacing * 2), size: 12, font: customFont, color: blackColor });
  page.drawText(nameAmh, { x: leftColX + amhL3W, y: colStartY - (lineSpacing * 2), size: 13, font: customFont, color: darkBlueColor });
  page.drawText(" ተሰጥቷል።", { x: leftColX + amhL3W + customFont.widthOfTextAtSize(nameAmh, 13) + 2, y: colStartY - (lineSpacing * 2), size: 12, font: customFont, color: blackColor });
  
  // Amh Line 4
  const amhL4_1 = "በመዝገብ ቁጥር ";
  const amhL4_1_W = customFont.widthOfTextAtSize(amhL4_1, 12);
  page.drawText(amhL4_1, { x: leftColX, y: colStartY - (lineSpacing * 3), size: 12, font: customFont, color: blackColor });
  page.drawText(certNo, { x: leftColX + amhL4_1_W, y: colStartY - (lineSpacing * 3), size: 13, font: customFont, color: darkBlueColor });
  
  const amhL4_2 = " ዛሬ ";
  const certNoW = customFont.widthOfTextAtSize(certNo, 13);
  const amhL4_2_W = customFont.widthOfTextAtSize(amhL4_2, 12);
  page.drawText(amhL4_2, { x: leftColX + amhL4_1_W + certNoW, y: colStartY - (lineSpacing * 3), size: 12, font: customFont, color: blackColor });
  
  const amhDay = issueDate.getDate().toString();
  const amhYear = issueDate.getFullYear().toString();
  const dateAmh = `${amhDay} ቀን ${amhYear}`;
  page.drawText(dateAmh, { x: leftColX + amhL4_1_W + certNoW + amhL4_2_W, y: colStartY - (lineSpacing * 3), size: 13, font: customFont, color: darkBlueColor });
  page.drawText(" ዓ.ም ተሰጥቷል።", { x: leftColX + amhL4_1_W + certNoW + amhL4_2_W + customFont.widthOfTextAtSize(dateAmh, 13), y: colStartY - (lineSpacing * 3), size: 12, font: customFont, color: blackColor });


  // Right Column - English
  const engL1Text = "This certificate is conferred to ";
  const engL1W = englishFont.widthOfTextAtSize(engL1Text, 12);
  page.drawText(engL1Text, { x: rightColX, y: colStartY, size: 12, font: englishFont, color: blackColor });
  // If nameEng is blank, leave space
  page.drawText(nameEng, { x: rightColX + engL1W, y: colStartY, size: 13, font: englishFontBold, color: darkBlueColor });

  const engL2_1 = "on ";
  const engL2_1_W = englishFont.widthOfTextAtSize(engL2_1, 12);
  page.drawText(engL2_1, { x: rightColX, y: colStartY - lineSpacing, size: 12, font: englishFont, color: blackColor });
  const engDate = `${issueDate.getDate()} ${issueDate.toLocaleString('default', { month: 'long' })} ${issueDate.getFullYear()}`;
  page.drawText(engDate, { x: rightColX + engL2_1_W, y: colStartY - lineSpacing, size: 12, font: englishFontBold, color: darkBlueColor });
  const engDateW = englishFontBold.widthOfTextAtSize(engDate, 12);
  const engL2_2 = ", with registration No. ";
  const engL2_2_W = englishFont.widthOfTextAtSize(engL2_2, 12);
  page.drawText(engL2_2, { x: rightColX + engL2_1_W + engDateW, y: colStartY - lineSpacing, size: 12, font: englishFont, color: blackColor });
  page.drawText(certNo, { x: rightColX + engL2_1_W + engDateW + engL2_2_W, y: colStartY - lineSpacing, size: 13, font: englishFontBold, color: darkBlueColor });

  page.drawText("to certify its personality in accordance with the proclamation No 1208/2020", { x: rightColX, y: colStartY - (lineSpacing * 2), size: 11, font: englishFont, color: blackColor });
  page.drawText("enacted to provide legal personality to the Ethiopian Council of Gospel", { x: rightColX, y: colStartY - (lineSpacing * 3), size: 11, font: englishFont, color: blackColor });
  page.drawText("Believers' Churches and its members.", { x: rightColX, y: colStartY - (lineSpacing * 4), size: 11, font: englishFont, color: blackColor });


    // Footer Signatures
    page.drawLine({ start: { x: 180, y: 120 }, end: { x: 350, y: 120 }, thickness: 1, color: blackColor });
    const p1 = "ፕሬዝዳንት / ";
    const p1W = customFont.widthOfTextAtSize(p1, 12);
    page.drawText(p1, { x: 215, y: 100, size: 12, font: customFont, color: blackColor });
    page.drawText("President", { x: 215 + p1W, y: 100, size: 12, font: englishFont, color: blackColor });

    page.drawLine({ start: { x: 490, y: 120 }, end: { x: 690, y: 120 }, thickness: 1, color: blackColor });
    const s1 = "ዋና ፀሀፊ / ";
    const s1W = customFont.widthOfTextAtSize(s1, 12);
    page.drawText(s1, { x: 520, y: 100, size: 12, font: customFont, color: blackColor });
    page.drawText("General Secretary", { x: 520 + s1W, y: 100, size: 12, font: englishFont, color: blackColor });


  // QR Code Header right corner
  const verificationUrl = `https://ecgbc.org/verify/${member.certificateNo}`;
  const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, color: { dark: '#003366', light: '#FFFFFF' } });
  const qrImageBytes = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
  const qrImage = await pdfDoc.embedPng(qrImageBytes);
  const qrDims = qrImage.scale(0.55);
  
  page.drawImage(qrImage, { x: width - 130, y: height - 160, width: qrDims.width, height: qrDims.height });

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
