// src/autoMoon.ts

import 'dotenv/config';

import { moonposition, julian } from 'astronomia';
import { connect, disconnect } from 'mongoose';
import { DateTime } from 'luxon';

import { MoonData } from './MoonData.model.js';
import { zodiacArray } from './zodiacArray.js';

/* ──────────────────────────────────────────────────────────── */
/* Тип-патч, чтобы подавить any-войсы от astronomia            */
/* ──────────────────────────────────────────────────────────── */

/** Возвращает знак Зодиака Луны на *день*:
 *  берём положение Луны в 15:00 по Москве (UTC+3) */
function getDailyLunarSign(date: DateTime): number {
  // 15:00 MSK → 12:00 UTC
  const dtUtc = date.set({ hour: 12, minute: 0, second: 0, millisecond: 0 });

  const jd =
    julian.CalendarGregorianToJD(dtUtc.year, dtUtc.month, dtUtc.day) +
    dtUtc.hour / 24; // часовая доля

  const moon = moonposition.position(jd) as { lon: number };
  const lonDeg = (moon.lon * 180) / Math.PI;

  return Math.floor(((lonDeg + 90) % 360) / 30);
}

/** Даты июня-2025 (UTC) */
function getJuneDates(): DateTime[] {
  const list: DateTime[] = [];
  let d: DateTime = DateTime.utc(2025, 8, 1);
  const end = d.endOf('month');
  while (d <= end) {
    list.push(d);
    d = d.plus({ days: 1 });
  }
  return list;
}

void (async () => {
  const mongoUrl = process.env.mongoUrl;
  if (!mongoUrl) {
    console.error('Нет mongoUrl в .env');
    process.exit(1);
  }

  await connect(mongoUrl);
  console.log('Подключился к MongoDB');

  console.log('Сравнение знаков Луны за июнь 2025:\n');

  for (const dt of getJuneDates()) {
    const localDate: string = dt.toFormat('dd.MM.yyyy');

    try {
      const dbEntry = await MoonData.findOne({ date: localDate });
      if (!dbEntry) {
        console.log(`${localDate}: нет данных в базе`);
        continue;
      }

      const calcSign = getDailyLunarSign(dt);
      const dbSign = dbEntry.zodiac;

      const ok = dbSign === calcSign;
      console.log(
        `${localDate}: база = ${dbSign} (${zodiacArray[dbSign]}), ` +
          `расчёт = ${calcSign} (${zodiacArray[calcSign]}) → ${ok ? '✔' : '❌'}`,
      );
    } catch (err) {
      console.error(`Ошибка ${localDate}:`, err);
    }
  }

  await disconnect();
  console.log('\nГотово. Отключаюсь от MongoDB.');
})();
