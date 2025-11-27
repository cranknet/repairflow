/**
 * Calculate the total financial loss from damaged parts in a return
 * @param returnItems Array of return items with part information
 * @returns Total loss amount (sum of unitPrice * quantity for DAMAGED items)
 */
export function calculateReturnLoss(returnItems: Array<{
  condition?: string | null;
  quantity: number;
  part: {
    unitPrice: number;
  };
}>): number {
  return returnItems
    .filter(item => (item.condition || 'GOOD') === 'DAMAGED')
    .reduce((total, item) => {
      return total + (item.part.unitPrice * item.quantity);
    }, 0);
}

