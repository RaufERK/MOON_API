require('dotenv').config();
import type { DayObject } from './types.js';

const fs = require('fs/promises');

const SunCalc = require('suncalc');

const { zodiacArray } = require('./zodiacArray');

const { dirName } = process.env;

export const fileParceFoo = async (fileName: string) => {
  try {
    console.log(14, fileName);
    const fileData: string = await fs.readFile(`${dirName}/${fileName}`, 'utf8');
    const startObject: DayObject = {};
    return fileData
      .trim()
      .split('\n')
      .reduce((acc: DayObject, el: string) => {
        const [dateStr, hourSt, zodiacStr]: string[] = el
          .trim()
          .split(' ')
          .filter((el) => el.trim());

        const [year] = fileName.split('.');
        const [day, month] = dateStr.split('.');

        // "YYYY-MM-DD" -  шаблон задания даты new Date()
        const dateObj = new Date(`${year}-${month}-${day}`);

        const today = dateObj.toLocaleDateString('ru');

        const zodiac: number = zodiacArray.indexOf(zodiacStr);

        const { fraction } = SunCalc.getMoonIllumination(dateObj);

        return {
          ...acc,
          [today]: {
            date: dateObj,
            zodiac,
            hour: hourSt,
            fullmoon: fraction > 0.91,
          },
        };
      }, startObject);
  } catch (error) {
    console.error(49, 'fileParceFoo', error);
  }
};
