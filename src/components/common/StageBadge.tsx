'use client';

import { STAGE_CONFIG, type RfqStage } from '@/lib/rfqUtils';

interface StageBadgeProps {
  stage: RfqStage;
}

export default function StageBadge({ stage }: StageBadgeProps) {
  const config = STAGE_CONFIG[stage];

  return (
    <span className={`inline-block px-1.5 py-0.5 text-[10px] ${config.bgClass}`}>
      {config.label}
    </span>
  );
}
