require('dotenv').config()
const readdir = require('fs/promises').readdir
const fileParse = require('./parseFile')
const { connect } = require('mongoose')
const MoonData = require('./MoonData.model')
const { mongoUrl, dirName } = process.env

connect(mongoUrl, async () => {
  try {
    const fileNames: string[] = await readdir(dirName)
    console.log('fileNames:', fileNames)
    const allResults = await Promise.all(
      fileNames.map((file) => fileParse(`${dirName}/${file}`))
    )
    console.log(allResults)

    const oneBigDataArray = Object.values(
      allResults.reduce((acc, el) => ({ ...acc, ...el }))
    )
    console.log(oneBigDataArray)

    await MoonData.deleteMany()
    await MoonData.insertMany(oneBigDataArray)
    const baseData = await MoonData.find({
      date: new Date().toLocaleDateString('ru'),
    })
    console.log(baseData)
  } catch (error) {
    console.log(error)
  }
})
