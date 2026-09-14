import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import QRCode from 'qrcode';
import fs from 'fs/promises';
import path from 'path';
import prisma from '../../config/db.config';
import { DESTINANTIONS } from '../../config/multer.config';
import { v4 as uuidv4 } from 'uuid';
import { letterTemplate } from '../templates/letter.template';
import { getEthiopianDate } from '../helpers/ethiopian-date.helper';

export interface CertificateLetterOptions {
  churchType?: 'new' | 'existing';
  refNo?: string;
  applicationDate?: string;
  issuedDate?: string;
  subject?: string;
  recipientName?: string;
  recipientAddress?: string;
  bylawPageCount?: number | string;
  ccPeaceSecurity?: string;
  dateAmh?: string;
  dateEng?: string;
}

const ETHIOPIAN_MONTHS = [
  'መስከረም', 'ጥቅምት', 'ህዳር', 'ታህሳስ', 'ጥር', 'የካቲት',
  'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ'
];

export class CertificateLetterService {
  static async generateLetter(
    memberId: string,
    options: CertificateLetterOptions = {},
    previewOnly: boolean = false
  ): Promise<any> {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: { councilFellowship: true, region: true },
    });

    if (!member) {
      throw new Error(`Member with ID ${memberId} not found.`);
    }

    return this.generateLetterForMember(member, options, previewOnly);
  }

  static async generateLetterForMember(
    member: any,
    options: CertificateLetterOptions = {},
    previewOnly: boolean = false
  ): Promise<any> {
    let browser = null;
    try {

      // 1. Assets Paths
      const fontPath = path.join(__dirname, '../../../../public/fonts/AmharicFont.ttf');
      const logoPath = path.join(__dirname, '../../../../public/images/logo.png');

      // Load Font as Base64
      let base64Font = '';
      try {
        const fontBytes = await fs.readFile(fontPath);
        base64Font = fontBytes.toString('base64');
      } catch (err) {
        console.warn(`Font not found at ${fontPath}. Proceeding without custom font.`);
      }

      // Load Logo as Base64 Data URL
      let logoBase64 = '';
      try {
        const logoBytes = await fs.readFile(logoPath);
        logoBase64 = `data:image/png;base64,${logoBytes.toString('base64')}`;
      } catch (err) {
        console.warn(`Local logo not found at ${logoPath}. Using fallback Cloudinary URL.`);
        logoBase64 = 'https://res.cloudinary.com/duijvdn0m/image/upload/v1766689161/logo_wzaui5.png';
      }

      // 2. Generate QR Code
      const baseUrl = process.env.CHURCH_PORTAL_URL || 'https://mychurch.ecgbc.org';
      const verificationUrl = `${baseUrl}/verify/${member.certificateNo}`;
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        margin: 1,
        color: { dark: '#1e3a5f', light: '#FFFFFF' }
      });

      // 3. Determine Church Type (new vs existing)
      const isNewChurch = options.churchType ? options.churchType === 'new' : true;

      // 4. Calculate Ethiopian & Gregorian Dates
      const now = new Date();
      const nowEth = getEthiopianDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
      const defaultDateAmh = `${nowEth.ethiopianDay}/${nowEth.ethiopianMonth}/${nowEth.ethiopianYear}`;
      const defaultDateEng = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

      // Calculate Issue Date in Ethiopian
      const certDate = member.certificateIssuedDate ? new Date(member.certificateIssuedDate) : now;
      const certEth = getEthiopianDate(certDate.getFullYear(), certDate.getMonth() + 1, certDate.getDate());
      const certMonthName = ETHIOPIAN_MONTHS[certEth.ethiopianMonth - 1] || 'ነሐሴ';
      const defaultIssuedDateAmh = `${certMonthName} ${String(certEth.ethiopianDay).padStart(2, '0')} ቀን ${certEth.ethiopianYear}`;

      // Calculate Application Date in Ethiopian (fallback to 2 months prior or registration/created date)
      const createdDate = member.createdAt ? new Date(member.createdAt) : now;
      const createdEth = getEthiopianDate(createdDate.getFullYear(), createdDate.getMonth() + 1, createdDate.getDate());
      const defaultAppDate = `${createdEth.ethiopianDay}/${createdEth.ethiopianMonth}/${createdEth.ethiopianYear}`;

      // Ref No default
      const defaultRefNo = `ኢወአክካ/ደብ/${member.certificateNo}/${String(nowEth.ethiopianYear).slice(-2)}`;

      // CC Peace and Security
      const defaultPeace = member.region?.description
        ? `${member.region.description} ሰላምና ጸጥታ ቢሮ`
        : 'አዲስ አበባ ከተማ አስተዳደር ሰላምና ጸጥታ ቢሮ';

      // 5. Compile Handlebars template
      const template = Handlebars.compile(letterTemplate);
      const htmlContent = template({
        base64Font,
        logoBase64,
        qrCodeBase64: qrCodeDataUrl,
        isNewChurch,
        churchName: member.name,
        certificateNo: member.certificateNo,
        refNo: options.refNo || defaultRefNo,
        dateAmh: options.dateAmh || defaultDateAmh,
        dateEng: options.dateEng || defaultDateEng,
        recipientName: options.recipientName || member.name,
        recipientAddress: options.recipientAddress || `${member.city || 'አዲስ አበባ'}፤`,
        subject: options.subject || (isNewChurch ? 'የምዝገባ ሰርተፍኬት ስለመስጠት' : 'ሰርተፍኬት ስለመስጠት'),
        applicationDate: options.applicationDate || defaultAppDate,
        issuedDate: options.issuedDate || defaultIssuedDateAmh,
        bylawPageCount: options.bylawPageCount || 21,
        ccPeaceSecurity: options.ccPeaceSecurity || defaultPeace,
      });

      // 6. Launch Puppeteer
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });

      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Generate PDF (A4 Portrait)
      const pdfBytes = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '15mm', right: '20mm', bottom: '15mm', left: '20mm' },
      });

      await browser.close();
      browser = null;

      if (previewOnly) {
        return pdfBytes;
      }

      // 7. Save to disk
      const fileName = `Letter_of_Certification_${member.certificateNo}_${uuidv4()}.pdf`;
      const saveDir = path.join(__dirname, '../../config', DESTINANTIONS.FILE.FILE);
      await fs.mkdir(saveDir, { recursive: true });
      await fs.writeFile(path.join(saveDir, fileName), pdfBytes);

      // 8. Save to DB
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
      if (browser) {
        await browser.close().catch(() => {});
      }
      console.error('CertificateLetterService error:', error);
      throw error;
    }
  }
}
