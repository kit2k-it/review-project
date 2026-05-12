const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find first PENDING job
  const job = await prisma.backgroundJob.findFirst({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  });

  if (!job) {
    console.log('No PENDING jobs found');
    await prisma.$disconnect();
    process.exit(0);
  }

  console.log(`Found PENDING job: ${job.id}`);
  console.log(`Company: ${job.companyId}, Type: ${job.jobType}`);

  // Try to execute it
  try {
    // Dynamically import the review action
    const { executeReviewGeneration } = require('./actions/review.js');

    console.log('Executing job...');
    await executeReviewGeneration(job.id);
    console.log('Job completed successfully');
  } catch (error) {
    console.error('Job failed:', error);
  }

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
