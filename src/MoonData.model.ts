import type { InferSchemaType } from 'mongoose';
import { model, Schema } from 'mongoose';

const MoonSchema = new Schema({
  date: { type: String, required: true }, // dd.MM.yyyy
  moonZodiac: { type: Number, required: true },
  sunZodiac: { type: Number, required: true },
  fullmoon: { type: Boolean, required: true },
});

export const MoonData = model('MoonData', MoonSchema);

export type MoonType = InferSchemaType<typeof MoonSchema>;
