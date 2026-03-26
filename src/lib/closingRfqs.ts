const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

export interface ClosingRfqInfo {
  id: string;
  status: string;
}

export function isClosingRfq(rfq: any): boolean {
  const addr = rfq.existingOptionAddress ?? rfq.params?.existingOptionAddress ?? '';
  return !!addr && addr !== ZERO_ADDR;
}

export function buildClosingRfqMap(rfqs: any[]): Map<string, ClosingRfqInfo> {
  const map = new Map<string, ClosingRfqInfo>();

  for (const rfq of rfqs) {
    if (!isClosingRfq(rfq)) continue;

    const status = rfq.status ?? rfq.state ?? '';
    // Skip settled/cancelled RFQs
    if (['settled', 'cancelled', 'expired'].includes(status.toLowerCase())) continue;

    const optAddr = (rfq.existingOptionAddress ?? rfq.params?.existingOptionAddress ?? '').toLowerCase();
    const id = (rfq.id ?? rfq.quotationId ?? '').toString();

    map.set(optAddr, { id, status });
  }

  return map;
}
