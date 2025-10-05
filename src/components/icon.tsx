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
          <stop offset="0%" stopColor="#6EBE4A" />
          <stop offset="100%" stopColor="#3d8c40" />
        </linearGradient>
      </defs>
      <path
        d="M6 20 C 10 10, 14 6, 22 2 C 20 10, 16 14, 6 20 Z"
        fill="url(#leafGradient)"
        stroke="none"
      />
      <path
        d="M9 17 C 12.5 11, 15.5 8, 20 4"
        stroke="#D4E79E"
        strokeWidth="0.8"
      />
    </svg>
  );
}
