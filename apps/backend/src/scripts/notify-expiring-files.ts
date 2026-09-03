import { PrismaClient } from '@prisma/client';
import prisma from '../app/config/db.config';

async function notifyExpiringFiles() {
  const daysThresholds = [30, 60, 90]; // Remind 30, 60, and 90 days before expiry

  console.log('Running expiring files notification job...');

  for (const days of daysThresholds) {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + days - 1);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + days);

    const expiringFiles = await prisma.file.findMany({
      where: {
        expiryDate: {
          gt: minDate,
          lte: maxDate,
        },
      },
      include: {
        member: {
          include: {
            contactPerson: true,
            churchUsers: true,
          }
        },
        councilFellowship: {
          include: {
            contactPerson: true,
          }
        },
        category: true,
      },
    });

    if (expiringFiles.length > 0) {
      console.log(`Found ${expiringFiles.length} files expiring in ~${days} days.`);
      
      for (const file of expiringFiles) {
        // Send email to staff/church
        console.log(`Document expiring: ${file.fileName} (Category: ${file.category?.value}) on ${file.expiryDate}`);
        
        // TODO: integrate with actual email sending service
        // e.g., send to church users
        /*
        if (file.member) {
           for (const user of file.member.churchUsers) {
               sendEmail(user.email, 'Document Expiring Soon', `Your document ${file.fileName} is expiring on ${file.expiryDate}. Please renew it.`);
           }
        }
        */
      }
    }
  }

  console.log('Finished expiring files notification job.');
}

notifyExpiringFiles()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
