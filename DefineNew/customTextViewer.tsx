import * as React from 'react';

interface Props {
  value: string;
}

export default function CustomTextViewer({ value }: Props) {
  return (
    <div title={value} className='custom-text-viewer'>
      {value}
    </div>
  );
}
