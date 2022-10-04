const { model } = require('mongoose')

const MoonDataModel = model('MoonData', {
  date: String,
  zodiac: Number,
  hour: Number,
  fullmoon: Boolean,
})
module.exports = MoonDataModel
