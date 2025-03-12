export type BaseObject = {
  date: Date;
  zodiac: number;
  hour: number;
  fullmoon: boolean;
};

export type DayObject = {
  [index: string]: BaseObject;
};
