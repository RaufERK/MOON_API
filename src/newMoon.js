import { EclipticLongitude, Body } from 'astronomy-engine';

const date = new Date();
const longitude = EclipticLongitude(Body.Moon, date);

console.log(longitude);
const zodiacSigns = [
  { name: 'Овен', start: 0 },
  { name: 'Телец', start: 30 },
  { name: 'Близнецы', start: 60 },
  { name: 'Рак', start: 90 },
  { name: 'Лев', start: 120 },
  { name: 'Дева', start: 150 },
  { name: 'Весы', start: 180 },
  { name: 'Скорпион', start: 210 },
  { name: 'Стрелец', start: 240 },
  { name: 'Козерог', start: 270 },
  { name: 'Водолей', start: 300 },
  { name: 'Рыбы', start: 330 },
];

const sign = zodiacSigns.find(
  (z, i, arr) =>
    longitude >= z.start &&
    (i === arr.length - 1 || longitude < arr[i + 1].start),
);

console.log(`Луна в знаке: ${sign?.name}`);
