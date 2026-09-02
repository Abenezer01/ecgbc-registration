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
    } catch (error: any) {
      console.error('Error generating certificate with Puppeteer:', error);
      throw new Error(`PDF Generation failed: ${error.message || String(error)}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
