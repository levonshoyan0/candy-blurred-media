import type { ReactNode } from 'react';
// Small inline icons approximating Candy.ai's mobile web UI.
type P = { size?: number };
const svg = (size: number, children: ReactNode, fill = 'none') => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {children}
  </svg>
);

export const Back = ({ size = 26 }: P) => svg(size, <path d="M15 4 7 12l8 8" />);
export const Phone = ({ size = 26 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1z" />
  </svg>
);
export const Clapper = ({ size = 26 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M3 10h18v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3.3 8.6 2.8 6.7a2 2 0 0 1 1.4-2.4l12.6-3.4a2 2 0 0 1 2.4 1.4l.5 1.9z" />
  </svg>
);
export const HeartLock = ({ size = 28 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path d="M8 7V5.5a4 4 0 0 1 8 0V7" fill="none" stroke="#f08aa6" strokeWidth={2.2} />
    <path d="M12 22s-9-5.3-9-11.2C3 8.1 5 6.5 7.3 6.5c1.9 0 3.4 1 4.7 2.6 1.3-1.6 2.8-2.6 4.7-2.6C19 6.5 21 8.1 21 10.8 21 16.7 12 22 12 22z" fill="#f08aa6" />
  </svg>
);
export const Sparkle = ({ size = 22 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M10 3l1.6 4.4L16 9l-4.4 1.6L10 15l-1.6-4.4L4 9l4.4-1.6zM18 13l.9 2.1L21 16l-2.1.9L18 19l-.9-2.1L15 16l2.1-.9z" />
  </svg>
);
export const Lock = ({ size = 12 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M7 10V7a5 5 0 0 1 10 0v3h1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1zm2 0h6V7a3 3 0 0 0-6 0z" />
  </svg>
);
export const Gift = ({ size = 24 }: P) =>
  svg(size, <><rect x="3" y="8" width="18" height="5" rx="1" /><path d="M5 13v8h14v-8M12 8v13M12 8S10.5 3 8 3.5 7 8 12 8zM12 8s1.5-5 4-4.5S17 8 12 8z" /></>);
export const Hanger = ({ size = 26 }: P) =>
  svg(size, <path d="M10 6a2 2 0 1 1 3 1.7c-.6.4-1 .9-1 1.6V10l9 6.5a1 1 0 0 1-.6 1.8H3.6a1 1 0 0 1-.6-1.8L12 10" />);
export const Mic = ({ size = 22 }: P) =>
  svg(size, <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>);
export const Send = ({ size = 20 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M21.4 2.6 2.9 9.3c-.9.3-.9 1.6 0 1.9l7 2.6 2.6 7c.3.9 1.6.9 1.9 0l6.7-18.5c.3-.8-.5-1.6-1.3-1.3z" />
  </svg>
);
export const Joystick = ({ size = 22 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <circle cx="12" cy="6" r="3.5" />
    <path d="M11 9h2v5h-2zM4 14.5 12 11l8 3.5-8 3.5zM4 15.5l8 3.5 8-3.5V17l-8 3.5L4 17z" />
  </svg>
);
export const Ring = ({ size = 22 }: P) => svg(size, <circle cx="12" cy="12" r="8" strokeWidth={2.5} />);
export const Sliders = ({ size = 22 }: P) =>
  svg(size, <path d="M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4" />);
export const ThumbUp = ({ size = 20 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M2 10h4v11H2zM8 21h9.3a2 2 0 0 0 2-1.6l1.6-7.4A2 2 0 0 0 19 9.6h-5.4l.8-3.9a2 2 0 0 0-.5-1.8L13 3 8 9z" />
  </svg>
);
export const Info = () => (
  <span className="info-i" aria-hidden>
    i
  </span>
);
export const Chevron = ({ size = 18 }: P) => svg(size, <path d="m6 9 6 6 6-6" />);
export const Close = ({ size = 22 }: P) => svg(size, <path d="M6 6l12 12M18 6 6 18" />);
export const Plus = ({ size = 20 }: P) => svg(size, <path d="M12 5v14M5 12h14" />);
export const Play = ({ size = 30 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" aria-hidden>
    <path d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5z" />
  </svg>
);
export const ChevronRight = ({ size = 20 }: P) => svg(size, <path d="m9 6 6 6-6 6" />);
/** Candy.ai's Premium gem (tilted, faceted), as on its "Upgrade to Premium" button. */
export const Diamond = ({ size = 26 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ transform: 'rotate(-18deg)' }}>
    <path d="M6.5 4h11L22 9.2 12 21 2 9.2z" fill="#ffd3de" />
    <path d="M2 9.2h20M8.6 9.2 12 21l3.4-11.8M6.5 4l2.1 5.2L12 4l3.4 5.2L17.5 4" fill="none" stroke="#e26d8c" strokeWidth={1.1} strokeLinejoin="round" />
  </svg>
);
