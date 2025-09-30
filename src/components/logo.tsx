import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 22c1.25-.91 2.42-2.44 3-4 .58-1.56 1.4-3.56 2-5 .6-1.44 1.25-3.08 2-4 .75-.92 1.58-1.76 2.5-2.5C12.42 5.58 13.73 5 15 5c2.27 0 4.5 1.5 6 3" />
      <path d="M12 13c-1.5-1.5-2-3.5-1-5" />
      <path d="M15 5c1.5 1.5 2 3.5 1 5s-2.5 2-4 2" />
      <path d="M19 8c1.5 1.5 2 3.5 1 5" />
    </svg>
  );
}
