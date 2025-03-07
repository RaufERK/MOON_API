require('dotenv').config()
import SunCalc from 'suncalc'

import type { BaseObject } from './types.js'

const { connect, disconnect } = require('mongoose')

const MoonData = require('./MoonData.model')

const { mongoUrl } = process.env

const startDate = new Date('2025/03/01')
const finalDate = new Date('2025/03/31')

const setDay = (param: number) =>
  new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate() + param
  )

;(async () => {
  try {
    await connect(mongoUrl || '')
    console.log('======>>')
    console.log({
      startDate: startDate.toLocaleDateString(),
      finalDate: finalDate.toLocaleDateString(),
    })

    const allBaseData: BaseObject[] = await MoonData.find()
    console.log(29, 'First Instance:', allBaseData[0])
    const newDataArray = []

    let index = 0
    let today = setDay(index)
    let last = allBaseData[0]

    while (today <= finalDate) {
      today = setDay(index++)
      const dateText: string = today.toLocaleDateString('ru')
      const foundInBase = allBaseData.find(({ date }) => date === dateText)

      if (foundInBase) {
        last = foundInBase
      } else {
        console.log(dateText, ': noData')

        const { fraction } = SunCalc.getMoonIllumination(today)

        newDataArray.push({
          date: dateText,
          zodiac: last.zodiac,
          hour: 0,
          fullmoon: fraction > 0.97,
        })
      }
    }
    console.log(58, newDataArray)
    await MoonData.insertMany(newDataArray)
    disconnect()
  } catch (error) {
    console.log(error)
  }
})()
