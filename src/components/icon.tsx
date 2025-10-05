import type { SVGProps } from 'react';

export function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <defs>
        <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8cbf40" />
          <stop offset="100%" stopColor="#3d8c40" />
        </linearGradient>
      </defs>
      <path d="M12 22V8" stroke="url(#leafGradient)" />
      <path d="M12 8c4-1 6-4 6-8" stroke="url(#leafGradient)" />
      <path d="M10 14c-4 0-6-3-6-6" stroke="url(#leafGradient)" />
      <path d="M14 14c4 0 6-3 6-6" stroke="url(#leafGradient)" />
      <path d="M12 18c-4 0-6-3-6-6" stroke="url(#leafGradient)" />
      <path d="M12 18c4 0 6-3 6-6" stroke="url(#leafGradient)" />
    </svg>
  );
}