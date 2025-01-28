import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";

/**
 * GET request handler to fetch transactions for a specific customer
 * @param request - Request object
 * @param params - Route parameters containing customer ID
 * @returns Response containing array of transactions or error message
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Convert customer ID to number
    const customerId = parseInt(params.id);

    // Fetch all transactions for the customer ordered by date
    const transactions = await prisma.transaction.findMany({
      where: {
        customerId: customerId,
      },
      orderBy: {
        date: 'desc', // Descending order by date
      },
      include: {
        customer: true, // Include customer data with each transaction
      },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching customer transactions:", error);
    return NextResponse.json(
      { error: "Error fetching transactions" },
      { status: 500 }
    );
  }
}

/**
 * POST request handler to add a new transaction for a specific customer
 * @param request - Request object
 * @param params - Route parameters containing customer ID
 * @returns Response containing the created transaction or error message
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = parseInt(params.id);
    const { type, amount, description, date } = await request.json();

    // التحقق من صحة البيانات
    if (!type || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid transaction data" },
        { status: 400 }
      );
    }

    // إنشاء المعاملة الجديدة
    const transaction = await prisma.transaction.create({
      data: {
        type,
        amount,
        description,
        date: new Date(date),
        customerId,
      },
    });

    // تحديث رصيد العميل في حساب العملة الافتراضي
    const amountChange = type === 'debit' ? amount : -amount;
    await prisma.customerAccount.updateMany({
      where: { 
        customerId,
        currency: 'SAR' // Assuming SAR is the default currency
      },
      data: {
        balance: {
          increment: amountChange
        }
      }
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Error creating transaction" },
      { status: 500 }
    );
  }
}
