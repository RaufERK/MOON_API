const { model, Schema } = require('mongoose')

const MoonScema = new Schema({
  date: String,
  zodiac: Number,
  hour: Number,
  fullmoon: Boolean,
})

module.exports = model('MoonData', MoonScema)
