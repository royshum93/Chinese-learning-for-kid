
export interface Word {
  id: string;
  text: string;
  emoji: string;
}

export interface Unit {
  id: number;
  title: string;
  icon: string;
  words: Word[];
  color: string;
}
