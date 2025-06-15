// src/auto.ts
import 'dotenv/config';

import { julian, moonposition, solar } from 'astronomia';
import { connect, disconnect } from 'mongoose';
import { DateTime } from 'luxon';
import SunCalc from 'suncalc';

import { MoonData } from './MoonData.model.js';

const fullMoonFactor = 0.98;

function deg(rad: number) {
  return (rad * 180) / Math.PI;
}

/** знак зодиака (0 = Козерог) на заданное UTC-время */
function getZodiacSignAt(
  dt: DateTime,
  posFn: (jd: number) => { lon: number },
): number {
  const jd =
    julian.CalendarGregorianToJD(dt.year, dt.month, dt.day) + dt.hour / 24;

  const lonDeg = deg(posFn(jd).lon);
  return Math.floor(((lonDeg + 90) % 360) / 30);
}

/** дата → DateTime на 12:00 МСК (09:00 UTC) */
function mskNoonUtc(dt: DateTime): DateTime {
  return dt.set({ hour: 9, minute: 0, second: 0, millisecond: 0 });
}

/** генератор дат с today → today + 10 лет */
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
    const dtUtc = mskNoonUtc(dt);

    const moonZodiac = getZodiacSignAt(dtUtc, moonposition.position);
    const sunZodiac = getZodiacSignAt(dtUtc, solar.apparentEquatorial);

    const { fraction } = SunCalc.getMoonIllumination(dtUtc.toJSDate());

    bulk.push({
      date: dateStr,
      moonZodiac,
      sunZodiac,
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
