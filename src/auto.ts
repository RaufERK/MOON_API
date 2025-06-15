/**
 * ▸ 01-01-curr в 00:00 МСК, далее до 31-12-curr в 12:00 МСК
 * ▸ Перезаписывает MoonData и печатает знак Луны / Солнца за год.
 */

import { julian, moonposition, solar } from 'astronomia';
import { connect, disconnect } from 'mongoose';
import { DateTime } from 'luxon';
import SunCalc from 'suncalc';
import 'dotenv/config';

import { MoonData } from './MoonData.model.js';
import { zodiacArray } from './zodiacArray.js';

const MSK = 'Europe/Moscow';
const fullMoonFactor = 0.98;

/* ─ helpers ─ */

const rad2deg = (r: number) => (r * 180) / Math.PI;
/** долгота/RA ° → № знака (0 = Cap) */
const toSign = (deg: number) => Math.floor(((deg + 90 + 360) % 360) / 30);

/** JD для указанного московского часа */
function jdMsk(dt: DateTime, hour: number) {
  const utc = dt.set({ hour, minute: 0, second: 0 }).toUTC();
  return (
    julian.CalendarGregorianToJD(utc.year, utc.month, utc.day) + utc.hour / 24
  );
}

/** 01-01-curr → 31-12-curr */
function* daysCurrentYear() {
  const y = DateTime.now().setZone(MSK).year;
  let d = DateTime.fromObject({ year: y, month: 1, day: 1 }, { zone: MSK });
  const end = d.endOf('year');
  while (d <= end) {
    yield d;
    d = d.plus({ days: 1 });
  }
}

/* ─ main ─ */

void (async () => {
  if (!process.env.mongoUrl) {
    console.error('❌  mongoUrl отсутствует в .env');
    process.exit(1);
  }
  await connect(process.env.mongoUrl);
  console.log('✅  MongoDB connected');

  const rows: any[] = [];

  for (const dMsk of daysCurrentYear()) {
    const hour = dMsk.day === 1 && dMsk.month === 1 ? 0 : 12;
    const jd = jdMsk(dMsk, hour);

    // Луна
    const moonSign = toSign(rad2deg(moonposition.position(jd).lon));

    // Солнце – берём RA (апп. экватор. координаты)
    const sunRAdeg = rad2deg(solar.apparentEquatorial(jd).ra);
    const sunSign = toSign(sunRAdeg);

    // Фаза Луны
    const { fraction } = SunCalc.getMoonIllumination(
      dMsk.set({ hour }).toUTC().toJSDate(),
    );

    rows.push({
      date: dMsk.toFormat('dd.MM.yyyy'),
      moonZodiac: moonSign,
      sunZodiac: sunSign,
      fullmoon: fraction > fullMoonFactor,
    });
  }

  /* запись в БД */
  await MoonData.deleteMany({});
  await MoonData.insertMany(rows);
  console.log(`🔄  Перезаписано ${rows.length} строк.`);

  /* вывод */
  console.log(`\n🗓  ${DateTime.now().year} (12:00 МСК, 01-01 — 00:00)\n`);
  rows.forEach((r) =>
    console.log(
      `${r.date} — ${zodiacArray[r.moonZodiac]}  ·  ${zodiacArray[r.sunZodiac]}`,
    ),
  );

  await disconnect();
  console.log('\n🔌  MongoDB disconnected.');
})();
