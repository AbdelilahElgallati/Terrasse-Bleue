'use client';

import { useState } from 'react';
import { imageSrc } from '@/lib/images';

export function SafeMenuImage({ value, alt, className }: { value?: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  return <img className={className} src={failed ? '/menu-fallback.svg' : imageSrc(value)} alt={alt} width={960} height={720} loading="eager" decoding="async" fetchPriority="high" onError={() => setFailed(true)} />;
}
