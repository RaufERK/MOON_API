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
require('dotenv').config();
const readdir = require('fs/promises').readdir;
const fileParse = require('./parseFile');
const { connect } = require('mongoose');
const MoonData = require('./MoonData.model');
const { mongoUrl, dirName } = process.env;
connect(mongoUrl, () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const fileNames = yield readdir(dirName);
        console.log('fileNames:', fileNames);
        const allResults = yield Promise.all(fileNames.map((file) => fileParse(`${dirName}/${file}`)));
        console.log(allResults);
        const oneBigDataArray = Object.values(allResults.reduce((acc, el) => (Object.assign(Object.assign({}, acc), el))));
        console.log(oneBigDataArray);
        yield MoonData.deleteMany();
        yield MoonData.insertMany(oneBigDataArray);
        const baseData = yield MoonData.find({
            date: new Date().toLocaleDateString('ru'),
        });
        console.log(baseData);
    }
    catch (error) {
        console.log(error);
    }
}));
