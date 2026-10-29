/** What the reviewer can send in the chat. Each chip can be used once per chat. */
export type ChipId = 'photo' | 'video' | 'tonight';

export const CHIPS: { id: ChipId; text: string }[] = [
  { id: 'photo', text: 'send me a photo' },
  { id: 'video', text: 'send me a video' },
  { id: 'tonight', text: 'what are you up to tonight?' },
];
