import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import QRCode from 'qrcode';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import prisma from '../../config/db.config';
import { DESTINANTIONS } from '../../config/multer.config';
import { v4 as uuidv4 } from "uuid";

export class CertificateService {
  private static async getAssetBuffer(relativePath: string): Promise<Buffer> {
    const candidates = [
      path.join(__dirname, '../../../../public', relativePath),
      path.join(__dirname, '../../../public', relativePath),
      path.join(__dirname, '../../public', relativePath),
      path.join(process.cwd(), 'public', relativePath),
      path.join(process.cwd(), 'apps/backend/public', relativePath),
    ];

    for (const p of candidates) {
      try {
        if (fsSync.existsSync(p)) {
          return await fs.readFile(p);
        }
      } catch {}
    }
    throw new Error(`Asset not found: ${relativePath}`);
  }

  static async generateMemberCertificate(
    memberId: string, 
    previewOnly: boolean = false, 
    layout: "standard" | "preprinted" = "standard"
  ): Promise<any> {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: { councilFellowship: true, region: true },
    });
    if (!member) throw new Error(`Member with ID ${memberId} not found.`);

    // 1. Load Font
    let fontBytes: Buffer;
    try {
      fontBytes = await this.getAssetBuffer('fonts/AmharicFont.ttf');
    } catch (err: any) {
      throw new Error(`Amharic font not found: ${err.message}`);
    }

    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);
    const customFont = await pdfDoc.embedFont(fontBytes);
    const englishFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const englishFontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    // Page setup (A4 Landscape)
    const page = pdfDoc.addPage([841.89, 595.28]);
    const { width, height } = page.getSize();

    const goldColor = rgb(1.0, 0.83, 0.24); // #FFD43D
    const darkBlueColor = rgb(0.317, 0.466, 0.619); // #51779E

    const drawCenteredText = (text: string, y: number, size: number, color: any, font: any) => {
      const textWidth = font.widthOfTextAtSize(text, size);
      page.drawText(text, { x: (width - textWidth) / 2, y, size, font, color });
    };

    // 2. Handle Background Image if "preprinted" layout is chosen
    if (layout === 'preprinted') {
      try {
        const bgBytes = await this.getAssetBuffer('images/certificate_bg.jpg');
        const bgImage = await pdfDoc.embedJpg(bgBytes);
        page.drawImage(bgImage, { x: 0, y: 0, width, height });
      } catch (err: any) {
        console.warn('Background image not found, falling back to standard layout:', err.message);
        layout = 'standard';
      }
    }

    // Layout coordinates
    const leftColX = 60;
    const rightColX = 470;
    const colStartY = height - 310;
    const lineSpacing = 26;

    // 3. For Standard layout: draw borders, logo, watermark, headers, titles, and signatures
    if (layout !== 'preprinted') {
      // Borders
      page.drawRectangle({ x: 30, y: 30, width: width - 60, height: height - 60, borderColor: goldColor, borderWidth: 4 });
      page.drawRectangle({ x: 38, y: 38, width: width - 76, height: height - 76, borderColor: darkBlueColor, borderWidth: 1 });
      page.drawRectangle({ x: 42, y: 42, width: width - 84, height: height - 84, borderColor: goldColor, borderWidth: 2 });

      // Load Logo
      let logoImageBytes: Buffer | null = null;
      try {
        logoImageBytes = await this.getAssetBuffer('images/logo.png');
      } catch {
        try {
          const logoUrl = 'https://res.cloudinary.com/duijvdn0m/image/upload/v1766689161/logo_wzaui5.png';
          const axios = (await import('axios')).default;
          const logoRes = await axios.get(logoUrl, { responseType: 'arraybuffer', timeout: 6000 });
          logoImageBytes = Buffer.from(logoRes.data);
        } catch (err: any) {
          console.warn('Could not fetch logo image:', err.message);
        }
      }

      if (logoImageBytes) {
        try {
          const logoImage = await pdfDoc.embedPng(logoImageBytes);

          // Watermark
          const watermarkSize = 400;
          page.drawImage(logoImage, { 
            x: (width - watermarkSize) / 2, 
            y: (height - watermarkSize) / 2, 
            width: watermarkSize, 
            height: watermarkSize, 
            opacity: 0.08 
          });

          // Header Logo
          const logoSize = 65;
          page.drawImage(logoImage, { x: (width - logoSize) / 2, y: height - 100, width: logoSize, height: logoSize });
        } catch (err: any) {
          console.warn('Could not embed logo into PDF:', err.message);
        }
      }

      // Headers
      drawCenteredText("የኢትዮጵያ ወንጌል አማኞች አብያተ ክርስቲያናት ካውንስል", height - 130, 24, darkBlueColor, customFont);
      drawCenteredText("Ethiopian Council of Gospel believers' Churches", height - 160, 18, darkBlueColor, englishFontBold);
      page.drawLine({ start: { x: width / 2 - 150, y: height - 180 }, end: { x: width / 2 + 150, y: height - 180 }, thickness: 2, color: goldColor });

      // Titles in each section
      page.drawText("የምዝገባ የምስክር ወረቀት", { x: leftColX, y: colStartY + 50, size: 22, font: customFont, color: goldColor });
      page.drawText("CERTIFICATE OF REGISTRATION", { x: rightColX, y: colStartY + 50, size: 16, font: englishFontBold, color: goldColor });

      // Footer Signatures
      page.drawLine({ start: { x: 180, y: 120 }, end: { x: 350, y: 120 }, thickness: 1, color: darkBlueColor });
      const p1 = "ፕሬዝዳንት / ";
      const p1W = customFont.widthOfTextAtSize(p1, 12);
      page.drawText(p1, { x: 215, y: 100, size: 12, font: customFont, color: darkBlueColor });
      page.drawText("President", { x: 215 + p1W, y: 100, size: 12, font: englishFont, color: darkBlueColor });

      page.drawLine({ start: { x: 490, y: 120 }, end: { x: 690, y: 120 }, thickness: 1, color: darkBlueColor });
      const s1 = "ዋና ፀሀፊ / ";
      const s1W = customFont.widthOfTextAtSize(s1, 12);
      page.drawText(s1, { x: 520, y: 100, size: 12, font: customFont, color: darkBlueColor });
      page.drawText("General Secretary", { x: 520 + s1W, y: 100, size: 12, font: englishFont, color: darkBlueColor });

      // Contact Info Footer
      const footerText = "+251-116-662044   |   E-Mail: info@ecgbc.org   |   www.ecgbc.org";
      drawCenteredText(footerText, 50, 10, darkBlueColor, englishFont);
    }

    // 4. Dynamic Body Content (Amharic Left, English Right)
    const nameAmh = member.name || "";
    const nameEng = member.nameEn || "";
    const certNo = member.certificateNo || "";
    const issueDate = member.certificateIssuedDate ? new Date(member.certificateIssuedDate) : new Date();

    // Left Column - Amharic
    page.drawText("በኢትዮጵያ ወንጌል አማኞች አብያተ ክርስቲያናት ካውንስል", { x: leftColX, y: colStartY, size: 12, font: customFont, color: darkBlueColor });
    page.drawText("አባላት ሕጋዊ ሰውነት ለመስጠት በወጣው", { x: leftColX, y: colStartY - lineSpacing, size: 12, font: customFont, color: darkBlueColor });
    
    // Line 3
    const amhL3_1 = "አዋጅ ቁጥር ";
    const amhL3_1_W = customFont.widthOfTextAtSize(amhL3_1, 12);
    page.drawText(amhL3_1, { x: leftColX, y: colStartY - (lineSpacing * 2), size: 12, font: customFont, color: darkBlueColor });
    const numPart = "1208/2012";
    const numPartW = englishFontBold.widthOfTextAtSize(numPart, 12);
    page.drawText(numPart, { x: leftColX + amhL3_1_W, y: colStartY - (lineSpacing * 2), size: 12, font: englishFontBold, color: darkBlueColor });
    page.drawText(" መሠረት ይህ የሕጋዊ ሰውነት", { x: leftColX + amhL3_1_W + numPartW, y: colStartY - (lineSpacing * 2), size: 12, font: customFont, color: darkBlueColor });
    
    // Line 4
    const amhL4Text = "ማረጋገጫ የምስክር ወረቀት ለ ";
    const amhL4W = customFont.widthOfTextAtSize(amhL4Text, 12);
    page.drawText(amhL4Text, { x: leftColX, y: colStartY - (lineSpacing * 3), size: 12, font: customFont, color: darkBlueColor });
    page.drawText(nameAmh, { x: leftColX + amhL4W, y: colStartY - (lineSpacing * 3), size: 13, font: customFont, color: goldColor });
    page.drawText(" ተሰጥቷል።", { x: leftColX + amhL4W + customFont.widthOfTextAtSize(nameAmh, 13) + 2, y: colStartY - (lineSpacing * 3), size: 12, font: customFont, color: darkBlueColor });
    
    // Line 5
    const amhL5_1 = "በመዝገብ ቁጥር ";
    const amhL5_1_W = customFont.widthOfTextAtSize(amhL5_1, 12);
    page.drawText(amhL5_1, { x: leftColX, y: colStartY - (lineSpacing * 4), size: 12, font: customFont, color: darkBlueColor });
    
    const certNoW = englishFontBold.widthOfTextAtSize(certNo, 13);
    page.drawText(certNo, { x: leftColX + amhL5_1_W, y: colStartY - (lineSpacing * 4), size: 13, font: englishFontBold, color: goldColor });
    
    const amhL5_2 = " ዛሬ ";
    const amhL5_2_W = customFont.widthOfTextAtSize(amhL5_2, 12);
    page.drawText(amhL5_2, { x: leftColX + amhL5_1_W + certNoW, y: colStartY - (lineSpacing * 4), size: 12, font: customFont, color: darkBlueColor });
    
    const amhDay = issueDate.getDate().toString();
    const amhYear = issueDate.getFullYear().toString();
    
    page.drawText(amhDay, { x: leftColX + amhL5_1_W + certNoW + amhL5_2_W, y: colStartY - (lineSpacing * 4), size: 13, font: englishFontBold, color: goldColor });
    const amhDayW = englishFontBold.widthOfTextAtSize(amhDay, 13);
    
    page.drawText(" ቀን ", { x: leftColX + amhL5_1_W + certNoW + amhL5_2_W + amhDayW, y: colStartY - (lineSpacing * 4), size: 12, font: customFont, color: goldColor });
    const kenW = customFont.widthOfTextAtSize(" ቀን ", 12);
    
    page.drawText(amhYear, { x: leftColX + amhL5_1_W + certNoW + amhL5_2_W + amhDayW + kenW, y: colStartY - (lineSpacing * 4), size: 13, font: englishFontBold, color: goldColor });
    const amhYearW = englishFontBold.widthOfTextAtSize(amhYear, 13);
    
    page.drawText(" ዓ.ም ተሰጥቷል።", { x: leftColX + amhL5_1_W + certNoW + amhL5_2_W + amhDayW + kenW + amhYearW, y: colStartY - (lineSpacing * 4), size: 12, font: customFont, color: darkBlueColor });

    // Right Column - English
    const engL1Text = "This certificate is conferred to ";
    const engL1W = englishFont.widthOfTextAtSize(engL1Text, 12);
    page.drawText(engL1Text, { x: rightColX, y: colStartY, size: 12, font: englishFont, color: darkBlueColor });
    page.drawText(nameEng, { x: rightColX + engL1W, y: colStartY, size: 13, font: englishFontBold, color: goldColor });

    const engL2_1 = "on ";
    const engL2_1_W = englishFont.widthOfTextAtSize(engL2_1, 12);
    page.drawText(engL2_1, { x: rightColX, y: colStartY - lineSpacing, size: 12, font: englishFont, color: darkBlueColor });
    const engDate = `${issueDate.getDate()} ${issueDate.toLocaleString('default', { month: 'long' })} ${issueDate.getFullYear()}`;
    page.drawText(engDate, { x: rightColX + engL2_1_W, y: colStartY - lineSpacing, size: 12, font: englishFontBold, color: goldColor });
    const engDateW = englishFontBold.widthOfTextAtSize(engDate, 12);
    const engL2_2 = ", with registration No. ";
    const engL2_2_W = englishFont.widthOfTextAtSize(engL2_2, 12);
    page.drawText(engL2_2, { x: rightColX + engL2_1_W + engDateW, y: colStartY - lineSpacing, size: 12, font: englishFont, color: darkBlueColor });
    page.drawText(certNo, { x: rightColX + engL2_1_W + engDateW + engL2_2_W, y: colStartY - lineSpacing, size: 13, font: englishFontBold, color: goldColor });

    page.drawText("to certify its personality in accordance with the proclamation No 1208/2020", { x: rightColX, y: colStartY - (lineSpacing * 2), size: 11, font: englishFont, color: darkBlueColor });
    page.drawText("enacted to provide legal personality to the Ethiopian Council of Gospel", { x: rightColX, y: colStartY - (lineSpacing * 3), size: 11, font: englishFont, color: darkBlueColor });
    page.drawText("Believers' Churches and its members.", { x: rightColX, y: colStartY - (lineSpacing * 4), size: 11, font: englishFont, color: darkBlueColor });

    // 5. Verification QR Code (Header Right Corner)
    const baseUrl = process.env.CHURCH_PORTAL_URL || "https://mychurch.ecgbc.org";
    const verificationUrl = `${baseUrl}/verify/${member.certificateNo}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, color: { dark: '#51779E', light: '#FFFFFF' } });
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
