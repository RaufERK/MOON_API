require('dotenv').config()
const { connect } = require('mongoose')
const MoonData = require('./MoonData.model')
const { mongoUrl } = process.env
const SunCalc = require('suncalc')
const Latitude = 55.4521 //Широта Москвы
const longitude = 37.3704 //долгота Москвы

const startDate = new Date('2022/09/01')
const finalDate = new Date('2024/03/01')
// const finalDate = new Date('2022/11/11')

let setDay = (param: number) =>
  new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate() + param
  )

connect(mongoUrl, async () => {
  try {
    console.log('======>>')
    console.log({ startDate, finalDate })

    const allBaseData = await MoonData.find()
    const newDataArray = []

    let index = 0
    let today = setDay(index)
    let last = allBaseData[0]

    while (today <= finalDate) {
      today = setDay(index++)
      const dateText: string = today.toLocaleDateString('ru')
      const foundInBase = allBaseData.find(
        ({ date }: { date: string }) => date === dateText
      )

      if (foundInBase) {
        last = foundInBase
      } else {
        console.log(dateText, ': noData')

        const { fraction } = SunCalc.getMoonIllumination(
          today,
          Latitude,
          longitude
        )

        newDataArray.push({
          date: dateText,
          zodiac: last.zodiac,
          hour: 0,
          fullmoon: fraction > 0.97,
        })
      }
    }
    console.log(newDataArray)
    await MoonData.insertMany(newDataArray)
  } catch (error) {
    console.log(error)
  }
})

export {}
