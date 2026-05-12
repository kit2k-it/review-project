import { prisma } from "@/lib/prisma";

async function checkJobs() {
  const jobs = await prisma.backgroundJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  console.log("Recent jobs:");
  for (const job of jobs) {
    console.log(`ID: ${job.id.slice(0,8)}... | Company: ${job.companyId} | Type: ${job.jobType} | Status: ${job.status} | Attempts: ${job.attempts} | Error: ${job.errorMsg || "none"}`);
  }

  const stats = await prisma.backgroundJob.groupBy({
    by: ["status"],
    _count: { id: true },
  });
  console.log("\nStats:", stats);

  await prisma.$disconnect();
}

checkJobs().catch(console.error);
