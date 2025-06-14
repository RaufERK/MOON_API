// src/MoonData.model.ts
import { model, Schema } from 'mongoose';

const MoonSchema = new Schema({
  date: String,
  zodiac: Number,
  hour: { type: Number, default: 0 }, // Значение по умолчанию 0
  fullmoon: Boolean,
});

export const MoonData = model('MoonData', MoonSchema);

