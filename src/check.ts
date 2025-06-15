import { connect, disconnect } from 'mongoose';
import { DateTime } from 'luxon';
import 'dotenv/config';

import { MoonData } from './MoonData.model.js';

// русские названия для вывода
const zodiacRu = [
  'козерог',
  'водолей',
  'рыбы',
  'овен',
  'телец',
  'близнецы',
  'рак',
  'лев',
  'дева',
  'весы',
  'скорпион',
  'стрелец',
];

const MSK = 'Europe/Moscow';
const today = DateTime.now().setZone(MSK).startOf('day');
const monthAhead = today.plus({ months: 1 }).endOf('day');
const yearAhead = today.plus({ years: 1 }).endOf('day');

void (async () => {
  const mongoUrl = process.env.mongoUrl;
  if (!mongoUrl) {
    console.error('❌ mongoUrl отсутствует в .env');
    process.exit(1);
  }

  await connect(mongoUrl);
  console.log('✅ Подключено к MongoDB');

  /* -------------------------------------------------------- */
  /* 1. Читаем все документы (≈ 3–4 тыс.)                     */
  /* -------------------------------------------------------- */
  const docs = await MoonData.find().lean();

  // конвертируем строковую дату в DateTime один раз
  const parsed = docs.map((d: any) => ({
    dt: DateTime.fromFormat(d.date, 'dd.MM.yyyy', { zone: MSK }),
    moon: d.moonZodiac,
    sun: d.sunZodiac,
  }));

  for (let index = 0; index < 400; index++) {
    const { dt, moon, sun } = parsed[index];
    console.log(
      `${dt.toFormat('dd.MM.yyyy')} — ${zodiacRu[moon]} - ${zodiacRu[sun]}`,
    );
  }

  // /* -------------------------------------------------------- */
  // /* 2. Ингрессии Луны — ближайший месяц                     */
  // /* -------------------------------------------------------- */
  // console.log('\n📆 Ингрессии Луны (ближайший месяц):\n');

  // const moonMonth = parsed
  //   .filter((d) => d.dt >= today && d.dt <= monthAhead)
  //   .sort((a, b) => a.dt.toMillis() - b.dt.toMillis());

  // let prevMoon: number | null = null;
  // for (const { dt, moon } of moonMonth) {
  //   if (moon !== prevMoon) {
  //     console.log(`${dt.toFormat('dd.MM.yyyy')} — ${zodiacRu[moon]}`);
  //     prevMoon = moon;
  //   }
  // }

  // /* -------------------------------------------------------- */
  // /* 3. Ингрессии Солнца — ближайший год                     */
  // /* -------------------------------------------------------- */
  // console.log('\n☀️ Ингрессии Солнца (ближайший год):\n');

  // const sunYear = parsed
  //   .filter((d) => d.dt >= today && d.dt <= yearAhead)
  //   .sort((a, b) => a.dt.toMillis() - b.dt.toMillis());

  // let prevSun: number | null = null;
  // for (const { dt, sun } of sunYear) {
  //   if (sun !== prevSun) {
  //     console.log(`${dt.toFormat('dd.MM.yyyy')} — ${zodiacRu[sun]}`);
  //     prevSun = sun;
  //   }
  // }

  // await disconnect();
  // console.log('\n🔌 Отключено от MongoDB. Готово.\n');
})();
