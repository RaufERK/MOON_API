/**
 * ▸ 01-01-curr 00:00 МСК, далее до 31-12 12:00 МСК
 * ▸ Считает знак Луны и Солнца, две оценки полнолуния
 * ▸ Полностью перезаписывает коллекцию MoonData
 * ▸ Печатает таблицу «день — луна · солнце |  fracSC / fracAstro»
 */

import { julian, moonposition, solar } from 'astronomia';
import { connect, disconnect } from 'mongoose';
import { DateTime } from 'luxon';
import 'dotenv/config';

import { MoonData } from './MoonData.model.js';
import { zodiacArray } from './zodiacArray.js';

const MSK = 'Europe/Moscow';
const fullMoonFactor = 0.04;

const yearDuration = 1; // 1 = текущий год; 2 = + следующий

/* ───────── helpers ───────── */

const rad2deg = (r: number) => (r * 180) / Math.PI;
const toSign = (deg: number) => Math.floor(((deg + 90 + 360) % 360) / 30); // 0 = Cap

/** JD для указанного московского часа */
const jdMsk = (dt: DateTime, hr: number) => {
  const utc = dt.set({ hour: hr, minute: 0, second: 0 }).toUTC();
  return (
    julian.CalendarGregorianToJD(utc.year, utc.month, utc.day) + utc.hour / 24
  );
};

/** elongation Sun–Moon → освещённая доля */
function illuminFracAstro(jd: number): number {
  const sunEq = solar.apparentEquatorial(jd); // ra, dec   (рад)
  const moonEq = moonposition.position(jd); // ra, dec …

  const cosψ =
    Math.sin(moonEq.dec) * Math.sin(sunEq.dec) +
    Math.cos(moonEq.dec) * Math.cos(sunEq.dec) * Math.cos(moonEq.ra - sunEq.ra);

  const frac = (1 + Math.max(-1, Math.min(1, cosψ))) / 2; // clamp
  return frac;
}

/** 01-01-curr → 31-12-curr (или +yearDuration-1) */
function* daysRange() {
  const y = DateTime.now().setZone(MSK).year;
  let d = DateTime.fromObject({ year: y, month: 1, day: 1 }, { zone: MSK });
  const end = d.plus({ years: yearDuration }).minus({ days: 1 });
  while (d <= end) {
    yield d;
    d = d.plus({ days: 1 });
  }
}

/* ───────── main ───────── */

void (async () => {
  if (!process.env.mongoUrl) {
    console.error('❌  mongoUrl отсутствует в .env');
    process.exit(1);
  }
  await connect(process.env.mongoUrl);
  console.log('✅  MongoDB connected');

  const bulk: any[] = [];

  for (const dMsk of daysRange()) {
    const hr = dMsk.day === 1 && dMsk.month === 1 ? 0 : 12;
    const jd = jdMsk(dMsk, hr);

    /* Луна */
    const moonSign = toSign(rad2deg(moonposition.position(jd).lon));

    /* Солнце – эклиптическая долгота λ⊙ */
    const sunSign = toSign(rad2deg(solar.apparentLongitude(jd)));

    const fractionAstro = illuminFracAstro(jd);

    bulk.push({
      date: dMsk.toFormat('dd.MM.yyyy'),
      moonZodiac: moonSign,
      sunZodiac: sunSign,
      fullmoon: fractionAstro < fullMoonFactor,
    });
  }

  /* запись в БД */
  await MoonData.deleteMany({});
  await MoonData.insertMany(bulk);
  console.log(`🔄  Записано ${bulk.length} строк.`);

  /* вывод */

  const thisYear = DateTime.now().year;
  console.log(`\n🗓  ${thisYear} год (12:00 МСК, 01-01 — 00:00)\n`);
  bulk
    .filter((r) => r.date.endsWith(`.${thisYear}`))
    .forEach((r) => {
      console.log(
        `${r.date} — ${zodiacArray[r.moonZodiac]} · ${zodiacArray[r.sunZodiac]} | ${r.fullmoon ? `✅` : `❌`} `,
      );
    });

  await disconnect();
  console.log('\n🔌  MongoDB disconnected.');
})();
