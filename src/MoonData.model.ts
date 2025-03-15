const { model, Schema } = require('mongoose');

const MoonSchema = new Schema({
  date: String,
  zodiac: Number,
  hour: { type: Number, default: 0 }, // Значение по умолчанию 0
  fullmoon: Boolean,
});

module.exports = model('MoonData', MoonSchema);
