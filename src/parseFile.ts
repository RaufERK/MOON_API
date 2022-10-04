const fs = require('fs/promises')
const zodiacArray = require('./zodiacArray')
const SunCalc = require('suncalc')
const Latitude = 55.4521 //Широта Москвы
const longitude = 37.3704 //долгота Москвы

async function fileParceFoo(fileName: string) {
  try {
    const fileData: string = await fs.readFile(fileName, 'utf8')
    return fileData
      .trim()
      .split('\n')
      .reduce((acc, el) => {
        let [data, time, sign, comment]: string[] = el
          .trim()
          .split(' ')
          .filter((el) => el.trim())

        const day = data?.slice(-10, -8)
        const month = data?.slice(-7, -5)
        const year = data?.slice(-4)
        const today = new Date(+year, +month - 1, +day)
        const dateString: string = today.toLocaleDateString('ru')

        const zodiacText: string = sign?.slice(-3)
        let zodiac: number = zodiacArray.indexOf(zodiacText)

        let hour = 0

        if (comment !== '<<<') {
          if (acc[dateString]) return acc
          hour = 0
        } else {
          hour = +time?.slice(-8, -6)
          if (hour > 12) {
            if (zodiac === 0) {
              zodiac = 11
            } else {
              zodiac--
            }
          }
        }

        const { fraction } = SunCalc.getMoonIllumination(
          today,
          Latitude,
          longitude
        )

        return {
          ...acc,
          [dateString]: {
            date: dateString,
            zodiac,
            hour,
            fullmoon: fraction > 0.97,
          },
        }
      }, {})
  } catch (error) {
    console.log(error)
  }
}

module.exports = fileParceFoo
