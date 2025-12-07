import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized - Admin access required' },
                { status: 403 }
            );
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        const text = await file.text();
        let backup: any;

        try {
            backup = JSON.parse(text);
        } catch {
            return NextResponse.json(
                { error: 'Invalid JSON file' },
                { status: 400 }
            );
        }

        // Validate backup structure
        if (!backup.version || !backup.data) {
            return NextResponse.json(
                { error: 'Invalid backup file format' },
                { status: 400 }
            );
        }

        // Import data in a transaction
        await prisma.$transaction(async (tx) => {
            // Delete existing data (in reverse dependency order)
            await tx.payment.deleteMany({});
            await tx.return.deleteMany({});
            await tx.ticketPart.deleteMany({});
            await tx.ticket.deleteMany({});
            await tx.part.deleteMany({});
            await tx.supplier.deleteMany({});
            await tx.customer.deleteMany({});
            await tx.expense.deleteMany({});
            await tx.sMSTemplate.deleteMany({});
            await tx.emailSettings.deleteMany({});
            await tx.notificationPreference.deleteMany({});
            await tx.settings.deleteMany({});

            // Re-import data
            const { data } = backup;

            // Settings
            if (data.settings?.length > 0) {
                await tx.settings.createMany({
                    data: data.settings.map((s: any) => ({
                        key: s.key,
                        value: s.value,
                        description: s.description,
                    })),
                });
            }

            // Customers
            if (data.customers?.length > 0) {
                await tx.customer.createMany({
                    data: data.customers.map((c: any) => ({
                        id: c.id,
                        name: c.name,
                        email: c.email,
                        phone: c.phone,
                        address: c.address,
                        notes: c.notes,
                    })),
                });
            }

            // Suppliers
            if (data.suppliers?.length > 0) {
                await tx.supplier.createMany({
                    data: data.suppliers.map((s: any) => ({
                        id: s.id,
                        name: s.name,
                        email: s.email,
                        phone: s.phone,
                        address: s.address,
                        contactPerson: s.contactPerson,
                        notes: s.notes,
                    })),
                });
            }

            // Parts
            if (data.parts?.length > 0) {
                await tx.part.createMany({
                    data: data.parts.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        description: p.description,
                        sku: p.sku,
                        quantity: p.quantity,
                        unitPrice: p.unitPrice,
                        reorderLevel: p.reorderLevel,
                        supplierId: p.supplierId,
                    })),
                });
            }

            // Tickets
            if (data.tickets?.length > 0) {
                for (const ticket of data.tickets) {
                    await tx.ticket.create({
                        data: {
                            id: ticket.id,
                            ticketNumber: ticket.ticketNumber,
                            customerId: ticket.customerId,
                            deviceBrand: ticket.deviceBrand,
                            deviceModel: ticket.deviceModel,
                            deviceIssue: ticket.deviceIssue,
                            deviceConditionFront: ticket.deviceConditionFront,
                            deviceConditionBack: ticket.deviceConditionBack,
                            status: ticket.status,
                            priority: ticket.priority,
                            estimatedPrice: ticket.estimatedPrice,
                            finalPrice: ticket.finalPrice,
                            trackingCode: ticket.trackingCode,
                            notes: ticket.notes,
                            warrantyDays: ticket.warrantyDays,
                            warrantyText: ticket.warrantyText,
                            paid: ticket.paid ?? ticket.isPaid ?? false,
                            assignedToId: ticket.assignedToId,
                            completedAt: ticket.completedAt ? new Date(ticket.completedAt) : null,
                        },
                    });
                }
            }

            // Ticket Parts
            for (const ticket of data.tickets || []) {
                if (ticket.parts?.length > 0) {
                    await tx.ticketPart.createMany({
                        data: ticket.parts.map((tp: any) => ({
                            id: tp.id,
                            ticketId: ticket.id,
                            partId: tp.partId,
                            quantity: tp.quantity,
                        })),
                    });
                }
            }

            // Payments
            if (data.payments?.length > 0) {
                await tx.payment.createMany({
                    data: data.payments.map((p: any) => ({
                        id: p.id,
                        ticketId: p.ticketId,
                        amount: p.amount,
                        paymentMethod: p.paymentMethod,
                        reference: p.reference,
                        createdById: p.createdById,
                    })),
                });
            }

            // Returns
            if (data.returns?.length > 0) {
                await tx.return.createMany({
                    data: data.returns.map((r: any) => ({
                        id: r.id,
                        ticketId: r.ticketId,
                        reason: r.reason,
                        status: r.status,
                        refundAmount: r.refundAmount,
                        createdById: r.createdById,
                        processedById: r.processedById,
                        processedAt: r.processedAt ? new Date(r.processedAt) : null,
                    })),
                });
            }

            // Expenses
            if (data.expenses?.length > 0) {
                await tx.expense.createMany({
                    data: data.expenses.map((e: any) => ({
                        id: e.id,
                        description: e.description,
                        amount: e.amount,
                        category: e.category,
                        date: e.date ? new Date(e.date) : undefined,
                        notes: e.notes,
                        createdById: e.createdById,
                    })),
                });
            }

            // SMS Templates
            if (data.smsTemplates?.length > 0) {
                await tx.sMSTemplate.createMany({
                    data: data.smsTemplates.map((t: any) => ({
                        id: t.id,
                        name: t.name,
                        type: t.type,
                        message: t.message,
                        language: t.language,
                        isActive: t.isActive,
                    })),
                });
            }

            // Email Settings
            if (data.emailSettings?.length > 0) {
                await tx.emailSettings.createMany({
                    data: data.emailSettings.map((e: any) => ({
                        id: e.id,
                        smtpHost: e.smtpHost,
                        smtpPort: e.smtpPort,
                        smtpSecure: e.smtpSecure,
                        smtpUser: e.smtpUser,
                        smtpPassword: e.smtpPassword,
                        fromEmail: e.fromEmail,
                        fromName: e.fromName,
                        isEnabled: e.isEnabled,
                    })),
                });
            }

            // Notification Preferences
            if (data.notificationPreferences?.length > 0) {
                await tx.notificationPreference.createMany({
                    data: data.notificationPreferences.map((np: any) => ({
                        id: np.id,
                        userId: np.userId,
                        type: np.type,
                        email: np.email,
                        inApp: np.inApp,
                    })),
                });
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Database imported successfully',
        });
    } catch (error: any) {
        console.error('Database import error:', error);
        return NextResponse.json(
            { error: 'Failed to import database', message: error.message },
            { status: 500 }
        );
    }
}
