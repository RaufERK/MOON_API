// src/MoonData.model.ts
import { model, Schema } from 'mongoose';

const MoonSchema = new Schema({
  date: String, // dd.MM.yyyy
  moonZodiac: Number,
  sunZodiac: Number,
  fullmoon: Boolean,
});

export const MoonData = model('MoonData', MoonSchema);
