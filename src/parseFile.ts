// Загружаем переменные окружения (.env)
import 'dotenv/config';
import fs from 'node:fs/promises';

import { DateTime } from 'luxon';
import SunCalc from 'suncalc';

import type { FileDatesMap } from './types.js';
import { zodiacArray, localData, fullMoonFactor } from './zodiacArray.js';

const { dirName } = process.env;

// Основная функция разбора одного текстового файла с лунными ингрессиями
export const fileParseFoo = async (fileName: string) => {
  try {
    if (!dirName) throw new Error('Не указан dirName в переменных окружения');

    // Читаем содержимое файла
    const fileData: string = await fs.readFile(
      `${dirName}/${fileName}`,
      'utf8',
    );
    if (!fileData.trim()) throw new Error(`Файл ${fileName} пуст`);

    // Извлекаем год из имени файла (например: "2025.txt" → 2025)
    const [year] = fileName.split('.');

    let startDate: DateTime | null = null; // первая дата в файле
    let endDate: DateTime | null = null; // последняя дата в файле

    const daysMap: FileDatesMap = {}; // собираем сюда данные по датам

    // Разбираем построчно содержимое файла
    fileData
      .trim()
      .split('\n')
      .forEach((el) => {
        const [dateStr, hourAsString, zodiacStr] = el
          .trim()
          .split(' ')
          .filter(Boolean);

        // Преобразуем дату (например, "14.01") в объект DateTime
        const [day, month] = dateStr.split('.');
        const dateObj = DateTime.fromObject(
          { year: Number[year], month: Number(month), day: Number(day) },
          { zone: 'Europe/Moscow' },
        );

        // Обновляем границы диапазона дат
        startDate = startDate ? DateTime.min(startDate, dateObj) : dateObj;
        endDate = endDate ? DateTime.max(endDate, dateObj) : dateObj;

        // Форматируем дату как строку "dd.MM.yyyy"
        const today = dateObj.toFormat(localData);

        // Вычисляем, близка ли Луна к полнолунию
        const { fraction } = SunCalc.getMoonIllumination(dateObj.toJSDate());

        // Записываем данные на конкретную дату
        daysMap[today] = {
          date: today,
          zodiac: zodiacArray.indexOf(zodiacStr),
          hour: Number(hourAsString),
          fullmoon: fraction > fullMoonFactor,
        };
      });

    // ───────────────
    // Заполняем пропущенные даты, если они есть
    // ───────────────

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
        // Если на эту дату уже есть данные — используем их
        midDayData = { ...daysMap[localDate] };

        if (daysMap[localDate].hour > 15) {
          // Если смена знака Луны была после 12:00 — считаем, что целый день Луна была в предыдущем знаке
          daysMap[localDate].zodiac = (daysMap[localDate].zodiac + 11) % 12;
        }
      } else {
        // Если данных нет — используем предыдущий знак Луны и вычисляем фазу Луны
        const { fraction } = SunCalc.getMoonIllumination(indexDate.toJSDate());

        daysMap[localDate] = {
          date: localDate,
          zodiac: midDayData.zodiac,
          hour: 0,
          fullmoon: fraction > fullMoonFactor,
        };
      }
    }

    // Выводим отладочную информацию
    console.log('===|fileParseFoo|===>');

    // Сортируем даты по возрастанию
    const sortedDays = Object.values(daysMap).sort(
      (a, b) =>
        DateTime.fromFormat(a.date, localData).toMillis() -
        DateTime.fromFormat(b.date, localData).toMillis(),
    );

    console.log(sortedDays);
    return sortedDays;
  } catch (error) {
    console.error(49, 'fileParseFoo', error);
  }
};
