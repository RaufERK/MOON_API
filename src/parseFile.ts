require('dotenv').config()
import type { DayObject } from './types.js'

const fs = require('fs/promises')

const SunCalc = require('suncalc')

const { zodiacArray } = require('./zodiacArray')

const { dirName } = process.env

export const fileParceFoo = async (fileName: string) => {
  try {
    const fileData: string = await fs.readFile(`${dirName}/${fileName}`, 'utf8')
    const startObject: DayObject = {}
    return fileData
      .trim()
      .split('\n')
      .reduce((acc: DayObject, el: string) => {
        const [data, hourSt, sign, comment]: string[] = el
          .trim()
          .split(' ')
          .filter((el) => el.trim())

        const day = data?.slice(-10, -8)
        const month = data?.slice(-7, -5)
        const year = data?.slice(-4)
        const today = new Date(+year, +month - 1, +day)
        const dateString: string = today.toLocaleDateString('ru').toString()

        const zodiacText: string = sign?.slice(-3)
        let zodiac: number = zodiacArray.indexOf(zodiacText)

        let hour = 0

        if (comment !== '<<<') {
          // пишем предыдущее значение, если нет данных об этом дне
          if (acc[dateString]) return acc
          hour = 0
        } else {
          hour = +hourSt
          if (hour > 12) {
            if (zodiac === 0) {
              zodiac = 11
            } else {
              zodiac--
            }
          }
        }

        const { fraction } = SunCalc.getMoonIllumination(today)

        return {
          ...acc,
          [dateString]: {
            date: dateString,
            zodiac,
            hour,
            fullmoon: fraction > 0.97,
          },
        }
      }, startObject)
  } catch (error) {
    console.log(71, error)
  }
}
