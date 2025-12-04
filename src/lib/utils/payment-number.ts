/**
 * Generate a unique payment number in the format: PAY-YYYYMMDD-XXXX
 * Where XXXX is a 4-digit sequential number for the day
 */
export async function generatePaymentNumber(): Promise<string> {
  const { prisma } = await import('@/lib/prisma');
  
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
  const prefix = `PAY-${dateStr}-`;
  
  // Find the highest payment number for today
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);
  
  const lastPayment = await prisma.payment.findFirst({
    where: {
      paymentNumber: {
        startsWith: prefix,
      },
      createdAt: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
    orderBy: {
      paymentNumber: 'desc',
    },
  });
  
  let sequence = 1;
  if (lastPayment) {
    // Extract sequence number from last payment (e.g., PAY-20240101-0042 -> 42)
    const match = lastPayment.paymentNumber.match(/-(\d{4})$/);
    if (match) {
      sequence = parseInt(match[1], 10) + 1;
    }
  }
  
  // Format sequence as 4-digit number (0001, 0002, etc.)
  const sequenceStr = sequence.toString().padStart(4, '0');
  
  return `${prefix}${sequenceStr}`;
}

