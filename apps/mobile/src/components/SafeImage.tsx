import { useState } from 'react';
import {
  Image,
  type ImageProps,
  type ImageSourcePropType,
} from 'react-native';
import { fallbackImage } from '@/data/menu';

type Props = Omit<ImageProps, 'source'> & {
  source?: ImageSourcePropType;
  fallback?: ImageSourcePropType;
};

export function SafeImage({ source, fallback = fallbackImage, onError, ...props }: Props) {
  const [failedSource, setFailedSource] = useState<ImageSourcePropType>();
  const failed = failedSource === source;
  return (
    <Image
      {...props}
      source={failed || !source ? fallback : source}
      onError={(event) => {
        if (source) setFailedSource(source);
        onError?.(event);
      }}
    />
  );
}
