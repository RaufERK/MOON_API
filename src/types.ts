export type BaseObject = {
  date: string;
  zodiac: number;
  hour: number;
  fullmoon: boolean;
};

export type FileDatesMap = Record<string, BaseObject>;
