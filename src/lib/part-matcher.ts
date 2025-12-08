/**
 * Part Matcher - Fuzzy matching to find existing parts in inventory
 */

import { prisma } from '@/lib/prisma';

export interface MatchedPart {
    name: string;
    quantity: number;
    unitPrice: number;
    sku?: string;
    matchedPartId: string | null;
    matchedPartName?: string;
    matchConfidence: number; // 0-100
    matchType: 'exact' | 'sku' | 'fuzzy' | 'none';
}

/**
 * Calculate similarity between two strings (Levenshtein-based)
 */
function calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 100;
    if (s1.length === 0 || s2.length === 0) return 0;

    // Levenshtein distance
    const matrix: number[][] = [];
    for (let i = 0; i <= s1.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= s2.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= s1.length; i++) {
        for (let j = 1; j <= s2.length; j++) {
            const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }

    const maxLen = Math.max(s1.length, s2.length);
    const distance = matrix[s1.length][s2.length];
    return Math.round((1 - distance / maxLen) * 100);
}

/**
 * Normalize part name for matching (remove common variations)
 */
function normalizeName(name: string): string {
    return name
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[-_]/g, ' ')
        .replace(/\s*screen\s*/gi, ' screen ')
        .replace(/\s*battery\s*/gi, ' battery ')
        .replace(/\s*lcd\s*/gi, ' lcd ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Find matching parts in the inventory
 */
export async function matchPartsToInventory(
    extractedParts: Array<{ name: string; quantity: number; unitPrice: number; sku?: string }>
): Promise<MatchedPart[]> {
    // Fetch all parts from inventory
    const allParts = await prisma.part.findMany({
        select: {
            id: true,
            name: true,
            sku: true,
            unitPrice: true,
        },
    });

    const results: MatchedPart[] = [];

    for (const extracted of extractedParts) {
        let bestMatch: { id: string; name: string; confidence: number; type: 'exact' | 'sku' | 'fuzzy' | 'none' } = {
            id: '',
            name: '',
            confidence: 0,
            type: 'none',
        };

        const normalizedExtracted = normalizeName(extracted.name);

        for (const part of allParts) {
            // 1. Exact name match (100% confidence)
            if (part.name.toLowerCase() === extracted.name.toLowerCase()) {
                bestMatch = { id: part.id, name: part.name, confidence: 100, type: 'exact' };
                break;
            }

            // 2. SKU match (95% confidence)
            if (extracted.sku && part.sku && part.sku.toLowerCase() === extracted.sku.toLowerCase()) {
                if (bestMatch.confidence < 95) {
                    bestMatch = { id: part.id, name: part.name, confidence: 95, type: 'sku' };
                }
                continue;
            }

            // 3. Fuzzy name match (similarity-based)
            const normalizedPart = normalizeName(part.name);
            const similarity = calculateSimilarity(normalizedExtracted, normalizedPart);

            if (similarity >= 80 && similarity > bestMatch.confidence) {
                bestMatch = { id: part.id, name: part.name, confidence: similarity, type: 'fuzzy' };
            }
        }

        results.push({
            name: extracted.name,
            quantity: extracted.quantity,
            unitPrice: extracted.unitPrice,
            sku: extracted.sku,
            matchedPartId: bestMatch.confidence >= 80 ? bestMatch.id : null,
            matchedPartName: bestMatch.confidence >= 80 ? bestMatch.name : undefined,
            matchConfidence: bestMatch.confidence,
            matchType: bestMatch.confidence >= 80 ? bestMatch.type : 'none',
        });
    }

    return results;
}

/**
 * Add matched parts to inventory (update quantities)
 */
export async function addMatchedPartsToInventory(
    matchedParts: MatchedPart[],
    userId: string,
    supplierId?: string
): Promise<{ updated: number; created: number; errors: string[] }> {
    const results = { updated: 0, created: 0, errors: [] as string[] };

    for (const part of matchedParts) {
        try {
            if (part.matchedPartId) {
                // Update existing part quantity and optionally link to supplier
                const updateData: any = {
                    quantity: { increment: part.quantity },
                };

                // Link to supplier if provided and part doesn't have one
                if (supplierId) {
                    const existingPart = await prisma.part.findUnique({
                        where: { id: part.matchedPartId },
                        select: { supplierId: true },
                    });
                    if (!existingPart?.supplierId) {
                        updateData.supplierId = supplierId;
                    }
                }

                await prisma.part.update({
                    where: { id: part.matchedPartId },
                    data: updateData,
                });

                // Create inventory transaction
                await prisma.inventoryTransaction.create({
                    data: {
                        partId: part.matchedPartId,
                        type: 'IN',
                        quantity: part.quantity,
                        reason: 'Receipt scan import',
                        createdBy: userId,
                    },
                });

                results.updated++;
            } else {
                // Create new part with supplier link
                const newPart = await prisma.part.create({
                    data: {
                        name: part.name,
                        sku: part.sku || `SKU-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase(),
                        quantity: part.quantity,
                        unitPrice: part.unitPrice,
                        reorderLevel: 5, // Default
                        supplierId: supplierId || null,
                    },
                });

                // Create inventory transaction
                await prisma.inventoryTransaction.create({
                    data: {
                        partId: newPart.id,
                        type: 'IN',
                        quantity: part.quantity,
                        reason: 'Receipt scan import - new part',
                        createdBy: userId,
                    },
                });

                results.created++;
            }
        } catch (error) {
            results.errors.push(`Failed to add "${part.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    return results;
}
