'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { apiAssetUrl, brandApi, type BrandData } from '@/lib/api';
import { cn } from '@/lib/utils';

type BrandProps = {
  className?: string;
  imageClassName?: string;
  showName?: boolean;
};

export function Brand({ className, imageClassName, showName = true }: BrandProps) {
  const [brand, setBrand] = useState<BrandData>({
    name: 'Saathika',
    logoUrl: null,
  });

  useEffect(() => {
    brandApi.get().then(setBrand).catch(() => {
      // Keep the bundled brand asset visible while the API is unavailable.
    });
  }, []);

  const logoUrl = apiAssetUrl(brand.logoUrl);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {logoUrl ? (
        // The backend controls the logo host, so this cannot use Next's static image allowlist.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={brand.name + ' logo'}
          className={cn('h-10 w-10 rounded-full object-cover', imageClassName)}
        />
      ) : (
        <Image
          src="/saathika-logo.jpg"
          alt="Saathika logo"
          width={48}
          height={48}
          className={cn('h-10 w-10 rounded-full object-cover', imageClassName)}
        />
      )}
      {showName && <span className="font-bold text-lg">{brand.name}</span>}
    </div>
  );
}
