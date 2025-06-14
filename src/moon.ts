// src/moon.ts
// Загружаем переменные окружения из .env
import 'dotenv/config';

import { readdir } from 'fs/promises';

import { connect, disconnect } from 'mongoose';

import { MoonData } from './MoonData.model.js';
import { fileParseFoo } from './parseFile.js';

// Читаем конфигурацию из переменных окружения
const mongoUrl = process.env.mongoUrl;
const dirName = process.env.dirName || './data';

// Главная асинхронная функция
(async () => {
  // Проверяем наличие строки подключения к MongoDB
  if (!mongoUrl) {
    console.error('Нет данных для СУБД');
    return;
  }

  console.log('==== START ====>');

  // Подключаемся к MongoDB
  await connect(mongoUrl);
  console.log('Подключился к MongoDB');

  try {
    // Читаем список всех .txt-файлов в директории
    const fileNames = (await readdir(dirName)).filter((file) =>
      file.endsWith('.txt'),
    );
    console.log('Найденные файлы:', fileNames);

    // Обрабатываем каждый файл через fileParseFoo
    const allData = await Promise.allSettled(
      fileNames.map((file) => fileParseFoo(file)),
    );

    // Оставляем только успешно разобранные данные и сворачиваем в один массив
    const oneBigDataArray = allData
      .filter((res) => res.status === 'fulfilled')
      .map((res) => (res as PromiseFulfilledResult<any>).value)
      .flat();

    console.log(`Обработано записей: ${oneBigDataArray.length}`);

    // Очищаем коллекцию и записываем новые данные в БД
    await MoonData.deleteMany();
    await MoonData.insertMany(oneBigDataArray);
    console.log('Записал всё в базу');

    // Проверяем, что в базе есть данные на сегодняшний день
    const today = new Date().toLocaleDateString('ru');
    const baseData = await MoonData.find({ date: today });

    console.log('EXAMPLE:', baseData);
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    // Завершаем соединение с MongoDB
    console.log('Отключаюсь от MongoDB...');
    await disconnect();
  }
})();
