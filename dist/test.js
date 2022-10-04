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
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const { connect } = require('mongoose');
const MoonData = require('./MoonData.model');
const { mongoUrl } = process.env;
const SunCalc = require('suncalc');
const Latitude = 55.4521; //Широта Москвы
const longitude = 37.3704; //долгота Москвы
const startDate = new Date('2022/09/01');
const finalDate = new Date('2024/03/01');
// const finalDate = new Date('2022/11/11')
let setDay = (param) => new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + param);
connect(mongoUrl, () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('======>>');
        console.log({ startDate, finalDate });
        const allBaseData = yield MoonData.find();
        const newDataArray = [];
        let index = 0;
        let today = setDay(index);
        let last = allBaseData[0];
        while (today <= finalDate) {
            today = setDay(index++);
            const dateText = today.toLocaleDateString('ru');
            const foundInBase = allBaseData.find(({ date }) => date === dateText);
            if (foundInBase) {
                last = foundInBase;
            }
            else {
                console.log(dateText, ': noData');
                const { fraction } = SunCalc.getMoonIllumination(today, Latitude, longitude);
                newDataArray.push({
                    date: dateText,
                    zodiac: last.zodiac,
                    hour: 0,
                    fullmoon: fraction > 0.97,
                });
            }
        }
        console.log(newDataArray);
        yield MoonData.insertMany(newDataArray);
    }
    catch (error) {
        console.log(error);
    }
}));
