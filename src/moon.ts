require('dotenv').config();
import { DayObject, BaseObject } from './types';

const { readdir } = require('fs/promises');

const { connect, disconnect } = require('mongoose');

// const MoonData = require('./MoonData.model');
const { fileParceFoo } = require('./parseFile');

const { mongoUrl, dirName } = process.env;

type ExtremDate = { startDate: Date; endDate: Date };

(async () => {
  try {
    console.log('==== START ====>');
    console.log('==== START ====>');
    console.log('==== START ====>');
    if (!mongoUrl) return;
    await connect(mongoUrl);

    const fileNames = await readdir(dirName || './data');
    console.log(17, 'fileNames:', fileNames);

    const [filesData]: DayObject[] = await Promise.all(
      fileNames.filter((item) => item.includes('.txt')).map((file) => fileParceFoo(file)),
    );

    let startDate = new Date();
    let endDate = new Date(1900, 1, 1);

    console.log(
      28,
      Object.values(filesData).forEach(({ date }) => {
        console.log(date);
        startDate = startDate < date ? startDate : date;
        endDate = endDate > date ? endDate : date;
      }),
    );

    console.log('startDate:', startDate.toLocaleDateString('ru'));
    console.log('endDate:', endDate.toLocaleDateString('ru'));

    while (startDate < endDate) {
      console.log(39, startDate.toLocaleDateString('ru'));
      startDate.setDate(startDate.getDate() + 1);
    }
    // console.log(startDate.toLocaleDateString('ru'));
    // startDate.setDate(startDate.getDay() + 1);
    // console.log(startDate);
    // startDate.setDate(startDate.getDay() + 1);
    // console.log(startDate);

    // const { startDate, endDate } = .reduce(
    //   (acc, item: BaseObject) => {
    //     console.log(32, item);
    //     return {
    //       startDate: '',
    //       endDate: '',
    //     };
    //   },
    //   { startDate: '', endDate: '' },
    // );

    // console.log(42, allObjArray);

    // const oneBigDataArray = Object.values(
    //   allResults.reduce((acc, el) => ({ ...acc, ...el }), [])
    // )

    // console.log(20, oneBigDataArray)

    // await MoonData.deleteMany()
    // await MoonData.insertMany(oneBigDataArray)
    // const baseData = await MoonData.find({
    //   date: new Date(2025, 2, 1).toLocaleDateString('ru'),
    // })
    // console.log(33, baseData)
    console.log(52, 'FINISH!');

    await disconnect(); // Добавляем await
  } catch (error) {
    console.log(31, error);
  }
})();
