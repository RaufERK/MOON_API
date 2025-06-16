/**
 * ▸ 01-01-curr 00:00 MSK, затем каждый день 12:00 MSK до 31-12
 * ▸ Лунный и солнечный знак (30°-секторы, 0 = козерог), фаза Луны
 * ▸ Полностью перезаписывает коллекцию MoonData и печатает текущий год
 *
 *   npm i luxon mongoose astronomia suncalc
 *   npm run start
 */

import { julian, moonposition } from 'astronomia';
import { connect, disconnect } from 'mongoose';
import { DateTime } from 'luxon';
import SunCalc from 'suncalc';
import 'dotenv/config';

import type { MoonType } from './MoonData.model.js';
import { MoonData } from './MoonData.model.js';
import { zodiacArray } from './zodiacArray.js';

const MSK = 'Europe/Moscow';
const FULL_MOON_LIM = 0.97; // ≥ 98 % ⇒ полнолуние
const YEAR_SPAN = 1; // сколько лет вперёд считаем

/* ── математика ─────────────────────────────────────────────── */

const DEG = Math.PI / 180;
const rad2deg = (r: number) => r / DEG;
const norm360 = (d: number) => ((d % 360) + 360) % 360;

/** 0 = козерог (λ = 270° – 300°) */
const toSign = (lonDeg: number) => Math.floor(norm360(lonDeg - 270) / 30);

/** Истинная эклиптическая долгота Солнца (градусы) */
function sunTrueLon(jd: number): number {
  const T = (jd - 2451545.0) / 36525; // столетия от J2000.0
  const L0 = norm360(280.46646 + 36000.76983 * T + 0.0003032 * T * T); // средняя долгота
  const M = norm360(357.52911 + 35999.05029 * T - 0.0001537 * T * T); // средняя аномалия
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M * DEG) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * M * DEG) +
    0.000289 * Math.sin(3 * M * DEG); // уравнение центра
  return norm360(L0 + C);
}

/** Юлианский день в указанное *московское* время (0 или 12 ч) */
function jdMsk(dtMSK: DateTime, hour: 0 | 12): number {
  const utc = dtMSK.set({ hour, minute: 0, second: 0, millisecond: 0 }).toUTC();
  return (
    julian.CalendarGregorianToJD(utc.year, utc.month, utc.day) +
    (utc.hour + utc.minute / 60 + utc.second / 3600) / 24
  );
}

/** 01-01-curr → 31-12 (+YEAR_SPAN-1) */
function* days(): Generator<DateTime> {
  const y = DateTime.now().setZone(MSK).year;
  let d = DateTime.fromObject({ year: y, month: 1, day: 1 }, { zone: MSK });
  const end = d.plus({ years: YEAR_SPAN }).minus({ days: 1 });
  while (d <= end) {
    yield d;
    d = d.plus({ days: 1 });
  }
}

/* ── main ──────────────────────────────────────────────────── */

void (async () => {
  if (!process.env.mongoUrl) {
    console.error('❌  mongoUrl отсутствует в .env');
    return;
  }
  await connect(process.env.mongoUrl);
  console.log('✅  MongoDB connected');

  const rows: MoonType[] = [];

  for (const dtMSK of days()) {
    const hour = dtMSK.day === 1 && dtMSK.month === 1 ? 0 : 12;
    const jd = jdMsk(dtMSK, hour);

    /* Луна */
    const moonLon = rad2deg(moonposition.position(jd).lon);
    const moonSign = toSign(moonLon);

    /* Солнце */
    const sunLon = sunTrueLon(jd);
    const sunSign = toSign(sunLon);

    /* Фаза Луны (SunCalc) */
    const fraction = SunCalc.getMoonIllumination(
      dtMSK.set({ hour }).toUTC().toJSDate(),
    ).fraction;

    rows.push({
      date: dtMSK.toFormat('dd.MM.yyyy'),
      moonZodiac: moonSign,
      sunZodiac: sunSign,
      fullmoon: fraction >= FULL_MOON_LIM,
    });
  }

  await MoonData.deleteMany({});
  await MoonData.insertMany(rows);
  console.log(`🔄  Записано ${rows.length} строк\n`);

  /* печать текущего года */
  const y = DateTime.now().year;
  console.log(`🗓  ${y} год  (12:00 MSK, 01-01 — 00:00)\n`);
  rows
    .filter((r) => r.date.endsWith(`.${y}`))
    .forEach((r) =>
      console.log(
        `${r.date} — ${zodiacArray[r.moonZodiac]} · ${zodiacArray[r.sunZodiac]} | ` +
          (r.fullmoon ? '🌕' : '–'),
      ),
    );

  await disconnect();
  console.log('\n🔌  MongoDB disconnected.');
})();
