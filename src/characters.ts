import type { UserType } from './lib/media';

export interface Character {
  name: string;
  avatar: string;
  level: string;
  /** shown on the Premium paywall */
  paywall: string;
  /** what the revealed media looks like (AI-generated stand-ins) */
  photo: string;
  video: string;
}

const MEGAN = { name: 'Megan', avatar: './megan.png', paywall: './meg-paywall.jpg', video: './meg-video.jpg' };

/** Both users chat with Megan; only their access differs. */
export const CHARACTERS: Record<UserType, Character> = {
  free: { ...MEGAN, level: 'Stranger', photo: './meg-photo.jpg' },
  premium: { ...MEGAN, level: 'Match', photo: './meg-selfie.jpg' },
};
