require('dotenv').config();
import { readFile } from 'fs/promises';

import { BaseObject } from './types.js';

const SunCalc = require('suncalc');

const { zodiacArray } = require('./zodiacArray');

export const fileParceFoo = async (fileName: string) => {
  try {
    const fileData: string = await readFile(fileName, 'utf8');
    const startObject = {};
    return fileData
      .trim()
      .split('\n')
      .reduce((acc: BaseObject, el: string) => {
        const [data, time, sign, comment]: string[] = el
          .trim()
          .split(' ')
          .filter((el) => el.trim());

        const day = data?.slice(-10, -8);
        const month = data?.slice(-7, -5);
        const year = data?.slice(-4);
        const today = new Date(+year, +month - 1, +day);
        const dateString: string = today.toLocaleDateString('ru').toString();

        const zodiacText: string = sign?.slice(-3);
        let zodiac: number = zodiacArray.indexOf(zodiacText);

        let hour = 0;

        if (comment !== '<<<') {
          // пишем предыдущее значение, если нет данных об этом дне
          if (acc[dateString]) return acc;
          hour = 0;
        } else {
          hour = +time?.slice(-8, -6);
          if (hour > 12) {
            if (zodiac === 0) {
              zodiac = 11;
            } else {
              zodiac--;
            }
          }
        }

        const { fraction } = SunCalc.getMoonIllumination(today);

        return {
          ...acc,
          [dateString]: {
            date: dateString,
            zodiac,
            hour,
            fullmoon: fraction > 0.97,
          },
        };
      }, startObject);
  } catch (error) {
    console.log(71, error);
  }
};
