import { PDFDocument, rgb, degrees } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import QRCode from 'qrcode';
import fs from 'fs/promises';
import path from 'path';
import prisma from '../../config/db.config';
import { DESTINANTIONS } from '../../config/multer.config';
import { v4 as uuidv4 } from "uuid";

export class CertificateService {
  static async generateMemberCertificate(memberId: string, useImageFallback = true): Promise<any> {
    try {
      const member = await prisma.member.findUnique({
        where: { id: memberId },
        include: { councilFellowship: true, region: true },
      });
      if (!member) throw new Error(`Member with ID ${memberId} not found.`);

      const templatePath = path.join(__dirname, '../../../../public/templates/certificate-template.pdf');
      const fallbackImagePath = path.join(__dirname, '../../../../public/templates/certificate-bg.jpg');
      const fontPath = path.join(__dirname, '../../../../public/fonts/AmharicFont.ttf');

      let pdfDoc: PDFDocument;
      let isFallback = false;

      // Try loading the PDF template
      try {
        const templateBytes = await fs.readFile(templatePath);
        pdfDoc = await PDFDocument.load(templateBytes);
      } catch (err) {
        if (!useImageFallback) {
          console.warn(`Template not found at ${templatePath}.`);
          return null;
        }
        
        // Fallback: create PDF from image
        try {
          const imageBytes = await fs.readFile(fallbackImagePath);
          pdfDoc = await PDFDocument.create();
          const image = await pdfDoc.embedJpg(imageBytes);
          
          // The image is portrait but the certificate is landscape.
          // Let's create a landscape page and draw the image rotated.
          const page = pdfDoc.addPage([image.height, image.width]);
          
          page.drawImage(image, {
            x: 0,
            y: image.width,
            width: image.width,
            height: image.height,
            rotate: degrees(-90)
          });
          
          isFallback = true;
        } catch (imgErr) {
          console.warn(`Neither PDF template nor fallback image found.`);
          return null;
        }
      }

      // Font
      let fontBytes: Buffer;
      try {
        fontBytes = await fs.readFile(fontPath);
      } catch (err) {
        console.warn(`Font not found at ${fontPath}.`);
        return null; 
      }

      pdfDoc.registerFontkit(fontkit);
      const customFont = await pdfDoc.embedFont(fontBytes);

      const firstPage = pdfDoc.getPages()[0];
      const { width, height } = firstPage.getSize();
      const textColor = rgb(0, 0, 0);
      const whiteColor = rgb(1, 1, 1);

      // Coordinates specific to the fallback image provided (roughly estimated)
      // If we use the fallback image, we need to blank out the handwritten parts.
      if (isFallback) {
        // Blank out Church Name (Amharic & English)
        firstPage.drawRectangle({ x: width * 0.25, y: height * 0.65, width: width * 0.5, height: height * 0.1, color: whiteColor });
        // Blank out Date
        firstPage.drawRectangle({ x: width * 0.55, y: height * 0.56, width: width * 0.2, height: height * 0.05, color: whiteColor });
        // Blank out Certificate No
        firstPage.drawRectangle({ x: width * 0.55, y: height * 0.51, width: width * 0.2, height: height * 0.05, color: whiteColor });
        
        // Draw new text
        firstPage.drawText(member.name, { x: width * 0.3, y: height * 0.70, size: 28, font: customFont, color: textColor });
        if (member.nameEn) {
          firstPage.drawText(member.nameEn, { x: width * 0.3, y: height * 0.66, size: 20, font: customFont, color: textColor });
        }
        firstPage.drawText(member.certificateNo, { x: width * 0.6, y: height * 0.52, size: 18, font: customFont, color: textColor });
        
        const issuedDate = member.certificateIssuedDate ? new Date(member.certificateIssuedDate).toLocaleDateString() : new Date().toLocaleDateString();
        firstPage.drawText(issuedDate, { x: width * 0.6, y: height * 0.57, size: 18, font: customFont, color: textColor });
      } else {
        // Standard PDF Template coordinate logic
        firstPage.drawText(member.name, { x: width / 2 - 100, y: height - 350, size: 24, font: customFont, color: textColor });
        if (member.nameEn) {
          firstPage.drawText(member.nameEn, { x: width / 2 - 100, y: height - 390, size: 20, font: customFont, color: textColor });
        }
        firstPage.drawText(`No: ${member.certificateNo}`, { x: width / 2 - 100, y: height - 440, size: 16, font: customFont, color: textColor });
        const issuedDate = member.certificateIssuedDate ? new Date(member.certificateIssuedDate).toLocaleDateString() : new Date().toLocaleDateString();
        firstPage.drawText(`Date: ${issuedDate}`, { x: width / 2 - 100, y: height - 470, size: 16, font: customFont, color: textColor });
      }

      // QR Code
      const verificationUrl = `https://ecgbc.org/verify/${member.certificateNo}`;
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1 });
      const qrImageBytes = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
      const qrImage = await pdfDoc.embedPng(qrImageBytes);
      const qrDims = qrImage.scale(0.5);
      
      firstPage.drawImage(qrImage, {
        x: isFallback ? width * 0.75 : width - 200,
        y: isFallback ? height * 0.2 : 100,
        width: qrDims.width,
        height: qrDims.height,
      });

      // Save
      const pdfBytes = await pdfDoc.save();
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
    } catch (error) {
      console.error('Error generating certificate:', error);
      return null;
    }
  }
}
