// src/auto.ts
import 'dotenv/config';

import { moonposition, julian } from 'astronomia';
import { DateTime } from 'luxon';
import { connect, disconnect } from 'mongoose';
import SunCalc from 'suncalc';

import { MoonData } from './MoonData.model.js';

const fullMoonFactor = 0.98;

/** тип-заплатка для astronomia */
type MoonPos = { lon: number };

/** знак Луны (0 … 11) в 15-00 МСК */
function lunarSignAt15Msk(dt: DateTime): number {
  const dtUtc = dt.set({ hour: 12, minute: 0, second: 0, millisecond: 0 }); // 15:00 MSK = 12:00 UTC

  const jd =
    julian.CalendarGregorianToJD(dtUtc.year, dtUtc.month, dtUtc.day) +
    dtUtc.hour / 24;

  const moon = moonposition.position(jd) as MoonPos;
  const lonDeg = (moon.lon * 180) / Math.PI;

  // поворот на +90°, чтобы 0 = Козерог
  return Math.floor(((lonDeg + 90) % 360) / 30);
}

/** генерирует DateTime c today → today+10 лет (включительно) */
function* dailyRangeTenYears(): Generator<DateTime> {
  let d = DateTime.now().startOf('day').setZone('UTC');
  const end = d.plus({ years: 10 }).minus({ days: 1 });

  while (d <= end) {
    yield d;
    d = d.plus({ days: 1 });
  }
}

void (async () => {
  const mongoUrl = process.env.mongoUrl;
  if (!mongoUrl) {
    console.error('Нет mongoUrl в .env');
    process.exit(1);
  }

  await connect(mongoUrl);
  console.log('MongoDB connected — собираю данные…');

  const bulk = [];

  for (const dt of dailyRangeTenYears()) {
    const dateStr = dt.setZone('Europe/Moscow').toFormat('dd.MM.yyyy');

    const sign = lunarSignAt15Msk(dt);

    const { fraction } = SunCalc.getMoonIllumination(
      // проверяем фазу в то же время, 15:00 MSK
      dt.set({ hour: 12, minute: 0, second: 0, millisecond: 0 }).toJSDate(),
    );

    bulk.push({
      date: dateStr,
      zodiac: sign,
      hour: 15, // фиксируем, что взято в 15:00 МСК
      fullmoon: fraction > fullMoonFactor,
    });
  }

  console.log(`Сформировано записей: ${bulk.length}. Перезаписываю коллекцию…`);

  await MoonData.deleteMany({});
  await MoonData.insertMany(bulk);

  console.log(
    '✅ База обновлена. Всего строк:',
    await MoonData.countDocuments(),
  );

  await disconnect();
  console.log('MongoDB disconnected. Готово.');
})();
