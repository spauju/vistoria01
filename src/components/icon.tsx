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
          <stop offset="0%" stopColor="#6EAF45" />
          <stop offset="100%" stopColor="#4F8C31" />
        </linearGradient>
      </defs>
      <path 
        d="M3.5 20.5 C10 14, 16 8, 22 2" 
        stroke="url(#leafGradient)" 
        strokeWidth="3.5" 
        fill="none"
        transform="rotate(-10 12 12)"
       />
       <path 
        d="M4.5 19.5 C10 14, 16 8, 21 3" 
        stroke="#D4E7C5"
        strokeWidth="0.5"
        fill="none"
        transform="rotate(-10 12 12)"
       />
    </svg>
  );
}
