import type { UserType } from './lib/media';

export interface Character {
  name: string;
  avatar: string;
  level: string;
  /** what the revealed media looks like */
  photo: string;
  video: string;
}

/** Free users chat with Jennifer, Premium users with Megan (as in the reference screenshots). */
export const CHARACTERS: Record<UserType, Character> = {
  free: { name: 'Jennifer', avatar: './jen-av.jpg', level: 'Stranger', photo: './jen-photo.jpg', video: './jen-photo.jpg' },
  premium: { name: 'Megan', avatar: './megan.png', level: 'Match', photo: './megan.png', video: './meg-video.jpg' },
};
