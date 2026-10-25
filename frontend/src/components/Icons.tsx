import { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base: IconProps = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export const SearchIcon = (p: IconProps) => (
  <svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);
export const PlusIcon = (p: IconProps) => (
  <svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>
);
export const EditIcon = (p: IconProps) => (
  <svg {...base} {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
);
export const TrashIcon = (p: IconProps) => (
  <svg {...base} {...p}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
);
export const BoxIcon = (p: IconProps) => (
  <svg {...base} {...p}><path d="m21 8-9-5-9 5v8l9 5 9-5Z" /><path d="m3 8 9 5 9-5M12 13v8" /></svg>
);
export const LogoutIcon = (p: IconProps) => (
  <svg {...base} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
);
export const XIcon = (p: IconProps) => (
  <svg {...base} {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>
);
export const CartIcon = (p: IconProps) => (
  <svg {...base} {...p}><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" /></svg>
);

/** Simple side-on car silhouette used on vehicle cards. */
export const CarIllustration = (p: IconProps) => (
  <svg viewBox="0 0 160 70" fill="none" aria-hidden="true" {...p}>
    <path
      d="M10 46c0-5 3-8 8-9l20-4 14-15c3-3 6-4 10-4h38c5 0 9 2 12 5l13 13 18 4c5 1 7 4 7 9v6c0 3-2 5-5 5h-9a14 14 0 0 0-28 0H62a14 14 0 0 0-28 0H15c-3 0-5-2-5-5Z"
      fill="currentColor"
    />
    <path d="M58 16h22v17H45Zm30 0h16c2 0 3 1 4 2l11 15H88Z" fill="white" fillOpacity=".35" />
    <circle cx="48" cy="52" r="10" fill="#0f172a" />
    <circle cx="48" cy="52" r="4" fill="#e2e8f0" />
    <circle cx="116" cy="52" r="10" fill="#0f172a" />
    <circle cx="116" cy="52" r="4" fill="#e2e8f0" />
  </svg>
);
