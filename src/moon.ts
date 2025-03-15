require('dotenv').config();

import { readdir } from 'fs/promises';

import { connect, disconnect } from 'mongoose';

import { fileParseFoo } from './parseFile';

const MoonData = require('./MoonData.model');

const mongoUrl = process.env.mongoUrl;
const dirName = process.env.dirName || './data';

(async () => {
  if (!mongoUrl) {
    console.error('Нет данных для СУБД');
    return;
  }

  console.log('==== START ====>');

  await connect(mongoUrl);
  console.log('Подключился к MongoDB');

  try {
    const fileNames = (await readdir(dirName)).filter((file) =>
      file.endsWith('.txt'),
    );
    console.log('Найденные файлы:', fileNames);

    const allData = await Promise.allSettled(
      fileNames.map((file) => fileParseFoo(file)),
    );

    // Фильтруем успешные результаты и разворачиваем массив
    const oneBigDataArray = allData
      .filter((res) => res.status === 'fulfilled')
      .map((res) => (res as PromiseFulfilledResult<any>).value)
      .flat();

    console.log(`Обработано записей: ${oneBigDataArray.length}`);

    await MoonData.deleteMany();
    await MoonData.insertMany(oneBigDataArray);
    console.log('Записал всё в базу');

    const today = new Date().toLocaleDateString('ru');
    const baseData = await MoonData.find({ date: today });

    console.log('EXAMPLE:', baseData);
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    console.log('Отключаюсь от MongoDB...');
    await disconnect();
  }
})();
