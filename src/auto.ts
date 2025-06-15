/**
 * ▸ Считает знак Луны и Солнца для 12 ч МСК каждого дня
 *   (0 ч МСК только 01-01 текущего года).
 * ▸ Диапазон: 01-01-curr → 31-12-next  (730 суток).
 * ▸ Полностью перезаписывает коллекцию MoonData.
 * ▸ Печатает таблицу на текущий год.
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
const yearDuration = 1;

/* ───────── helpers ───────── */

const rad2deg = (r: number) => (r * 180) / Math.PI;
/** ecliptic-longitude [deg] ⇒ номер знака (0 = Козерог) */
const toSign = (λdeg: number) => Math.floor(((λdeg + 90) % 360) / 30);

/** юлианский день для указанного *московского* часа (UTC счёт сделаем сами) */
function jdMsk(dtMsk: DateTime, hourMsk: number): number {
  const utc = dtMsk.set({ hour: hourMsk, minute: 0, second: 0 }).toUTC();
  return (
    julian.CalendarGregorianToJD(utc.year, utc.month, utc.day) + utc.hour / 24
  );
}

/** генератор: 01 янв текущего года → 31 дек следующего */
function* daysTwoYears() {
  const y = DateTime.now().setZone(MSK).year;
  let d = DateTime.fromObject({ year: y, month: 1, day: 1 }, { zone: MSK });
  const last = d.plus({ years: yearDuration }).minus({ days: 1 });
  while (d <= last) {
    yield d;
    d = d.plus({ days: 1 });
  }
}

/* ───────── main ───────── */

void (async () => {
  const mongoUrl = process.env.mongoUrl;
  if (!mongoUrl) {
    console.error('❌  mongoUrl отсутствует в .env');
    process.exit(1);
  }

  await connect(mongoUrl);
  console.log('✅  MongoDB connected');

  const docs: any[] = [];

  for (const dMsk of daysTwoYears()) {
    // 01-01 – берём 00:00 МСК, все остальные – 12:00 МСК
    const hour = dMsk.day === 1 && dMsk.month === 1 ? 0 : 12;
    const jd = jdMsk(dMsk, hour);

    /* Луна */
    const λmoon = rad2deg(moonposition.position(jd).lon);
    const moonSign = toSign(λmoon);

    /* Солнце – геоцентрическая видимая долгота (без +π !) */
    const λsun = rad2deg(solar.apparentLongitude(jd));
    const sunSign = toSign(λsun);

    console.log(dMsk.toFormat('dd.MM.yyyy'), λmoon, moonSign, λsun, sunSign);

    /* фаза Луны в то же время */
    const { fraction } = SunCalc.getMoonIllumination(
      dMsk.set({ hour }).toUTC().toJSDate(),
    );

    docs.push({
      date: dMsk.toFormat('dd.MM.yyyy'),
      moonZodiac: moonSign,
      sunZodiac: sunSign,
      fullmoon: fraction > fullMoonFactor,
    });
  }

  // console.log(`🔄  Перезаписываю коллекцию (строк: ${docs.length})`);
  // await MoonData.deleteMany({});
  // await MoonData.insertMany(docs);

  // /* ───────── печать текущего года ───────── */
  // const y = DateTime.now().setZone(MSK).year;
  // console.log(`\n🗓  ${y} год (12:00 МСК, 01-01 — 00:00):\n`);
  // docs
  //   .filter((r) => r.date.endsWith(`.${y}`))
  //   .forEach((r) =>
  //     console.log(
  //       `${r.date} — ${zodiacArray[r.moonZodiac]}  ·  ${zodiacArray[r.sunZodiac]}`,
  //     ),
  //   );

  await disconnect();
  console.log('\n🔌  MongoDB disconnected. Готово.');
})();
