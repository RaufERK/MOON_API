require('dotenv').config();
import { DateTime } from 'luxon';

import type { FileDatesMap } from './types';

const fs = require('fs/promises');

const SunCalc = require('suncalc');

const { zodiacArray, localData } = require('./zodiacArray');

const { dirName } = process.env;

export const fileParseFoo = async (fileName: string) => {
  try {
    if (!dirName) throw new Error('Не указан dirName в переменных окружения');

    const fileData: string = await fs.readFile(
      `${dirName}/${fileName}`,
      'utf8',
    );

    if (!fileData.trim()) throw new Error(`Файл ${fileName} пуст`);

    const [year] = fileName.split('.');

    let startDate: DateTime | null = null;
    let endDate: DateTime | null = null;

    const daysMap: FileDatesMap = {};

    fileData
      .trim()
      .split('\n')
      .forEach((el) => {
        const [dateStr, hourAsString, zodiacStr] = el
          .trim()
          .split(' ')
          .filter(Boolean);

        const [day, month] = dateStr.split('.');
        const dateObj = DateTime.fromObject(
          { year: Number(year), month: Number(month), day: Number(day) },
          { zone: 'Europe/Moscow' },
        );

        startDate = startDate ? DateTime.min(startDate, dateObj) : dateObj;
        endDate = endDate ? DateTime.max(endDate, dateObj) : dateObj;

        const today = dateObj.toFormat(localData);
        const { fraction } = SunCalc.getMoonIllumination(dateObj.toJSDate());

        daysMap[today] = {
          date: today,
          zodiac: zodiacArray.indexOf(zodiacStr),
          hour: Number(hourAsString),
          fullmoon: fraction > 0.99,
        };
      });

    // Заполняем пропущенные даты
    let midDayData = daysMap[startDate?.toFormat(localData) ?? ''];
    if (!midDayData)
      throw new Error('Ошибка: не удалось определить начальные данные');

    for (
      let indexDate = startDate!;
      indexDate <= endDate!;
      indexDate = indexDate.plus({ days: 1 })
    ) {
      const localDate = indexDate.toFormat(localData);

      if (daysMap[localDate]) {
        midDayData = { ...daysMap[localDate] };
        if (daysMap[localDate].hour > 12) {
          // отматываем назад знак зодиака если смена знака позже 12 часов
          daysMap[localDate].zodiac = (daysMap[localDate].zodiac + 11) % 12;
        }
      } else {
        const { fraction } = SunCalc.getMoonIllumination(indexDate.toJSDate());
        daysMap[localDate] = {
          date: localDate,
          zodiac: midDayData.zodiac,
          hour: 0,
          fullmoon: fraction > 0.91,
        };
      }
    }

    console.log('===|fileParseFoo|===>');
    const sortedDays = Object.values(daysMap).sort(
      (a, b) =>
        DateTime.fromFormat(a.date, localData).toMillis() -
        DateTime.fromFormat(b.date, localData).toMillis(),
    );

    // console.log(sortedDays);
    return sortedDays;
  } catch (error) {
    console.error(49, 'fileParseFoo', error);
  }
};
