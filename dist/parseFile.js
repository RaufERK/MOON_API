"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const fs = require('fs/promises');
const zodiacArray = require('./zodiacArray');
const SunCalc = require('suncalc');
const Latitude = 55.4521; //Широта Москвы
const longitude = 37.3704; //долгота Москвы
function fileParceFoo(fileName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const fileData = yield fs.readFile(fileName, 'utf8');
            return fileData
                .trim()
                .split('\n')
                .reduce((acc, el) => {
                let [data, time, sign, comment] = el
                    .trim()
                    .split(' ')
                    .filter((el) => el.trim());
                const day = data === null || data === void 0 ? void 0 : data.slice(-10, -8);
                const month = data === null || data === void 0 ? void 0 : data.slice(-7, -5);
                const year = data === null || data === void 0 ? void 0 : data.slice(-4);
                const today = new Date(+year, +month - 1, +day);
                const dateString = today.toLocaleDateString('ru');
                const zodiacText = sign === null || sign === void 0 ? void 0 : sign.slice(-3);
                let zodiac = zodiacArray.indexOf(zodiacText);
                let hour = 0;
                if (comment !== '<<<') {
                    if (acc[dateString])
                        return acc;
                    hour = 0;
                }
                else {
                    hour = +(time === null || time === void 0 ? void 0 : time.slice(-8, -6));
                    if (hour > 12) {
                        if (zodiac === 0) {
                            zodiac = 11;
                        }
                        else {
                            zodiac--;
                        }
                    }
                }
                const { fraction } = SunCalc.getMoonIllumination(today, Latitude, longitude);
                return Object.assign(Object.assign({}, acc), { [dateString]: {
                        date: dateString,
                        zodiac,
                        hour,
                        fullmoon: fraction > 0.97,
                    } });
            }, {});
        }
        catch (error) {
            console.log(error);
        }
    });
}
module.exports = fileParceFoo;
