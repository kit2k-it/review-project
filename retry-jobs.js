import { prisma } from "@/lib/prisma";

async function retryPendingJobs() {
  console.log("Finding PENDING jobs...");

  const pendingJobs = await prisma.backgroundJob.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  console.log(`Found ${pendingJobs.length} PENDING jobs`);

  for (const job of pendingJobs) {
    console.log(`\nRetrying job ${job.id.slice(0, 8)}... (company: ${job.companyId})`);

    try {
      // Import executeReviewGeneration
      const { executeReviewGeneration } = await import("@/actions/review");

      // Execute the job
      await executeReviewGeneration(job.id);
      console.log(`✓ Job ${job.id.slice(0, 8)} completed successfully`);
    } catch (error) {
      console.error(`✗ Job ${job.id.slice(0, 8)} failed:`, error);
    }
  }

  console.log("\nDone!");
  await prisma.$disconnect();
}

retryPendingJobs().catch(console.error);
