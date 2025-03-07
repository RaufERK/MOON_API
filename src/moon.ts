require('dotenv').config()
const { readdir } = require('fs/promises')

const { connect, disconnect } = require('mongoose')

const MoonData = require('./MoonData.model')
const { fileParceFoo } = require('./parseFile')

const { mongoUrl, dirName } = process.env

;(async () => {
  try {
    if (!mongoUrl) return
    await connect(mongoUrl)

    const fileNames = await readdir(dirName || './data')
    console.log(11, 'fileNames:', fileNames)

    const allResults = await Promise.all(
      fileNames
        .filter((item) => item.includes('.txt'))
        .map((file) => fileParceFoo(file))
    )

    console.log(15, allResults)

    const oneBigDataArray = Object.values(
      allResults.reduce((acc, el) => ({ ...acc, ...el }), [])
    )

    console.log(20, oneBigDataArray)

    await MoonData.deleteMany()
    await MoonData.insertMany(oneBigDataArray)
    const baseData = await MoonData.find({
      date: new Date(2025, 2, 1).toLocaleDateString('ru'),
    })
    console.log(33, baseData)
    console.log(28, 'FINISH!')

    await disconnect() // Добавляем await
  } catch (error) {
    console.log(31, error)
  }
})()
