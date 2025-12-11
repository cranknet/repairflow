/**
 * Health Endpoint Unit Tests
 * @jest-environment node
 */
import { GET } from '@/app/api/health/route';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
    prisma: {
        $queryRaw: jest.fn(),
    },
}));

describe('GET /api/health', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(process, 'uptime').mockReturnValue(12345);
    });

    it('returns healthy status when database is connected', async () => {
        (prisma.$queryRaw as jest.Mock).mockResolvedValueOnce([{ '1': 1 }]);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.status).toBe('ok');
        expect(data.checks.database.status).toBe('ok');
        expect(data.checks.database.latency).toBeDefined();
        expect(data.uptime).toBe(12345);
        expect(data.timestamp).toBeDefined();
    });

    it('returns down status when database connection fails', async () => {
        (prisma.$queryRaw as jest.Mock).mockRejectedValueOnce(new Error('Connection refused'));

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(503);
        expect(data.status).toBe('down');
        expect(data.checks.database.status).toBe('error');
        expect(data.checks.database.error).toBe('Connection refused');
    });
});
