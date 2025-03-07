export type DayObject = {
  [index: string]: {
    date: string
    zodiac: number
    hour: number
    fullmoon: boolean
  }
}

export type BaseObject = {
  date: string
  zodiac: number
  hour: number
  fullmoon: boolean
}
