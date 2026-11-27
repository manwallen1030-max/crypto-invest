import prisma from '@/lib/prismakey';

export async function GET() {
  try {
    // Just ask the database "are you awake?"
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", db: "awake" });
  } catch (error) {
    return Response.json({ status: "error", db: "sleeping" }, { status: 500 });
  }
}