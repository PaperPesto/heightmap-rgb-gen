#!/usr/bin/env node

const path = require('path');
const fs = require('fs'),
    PNG = require('pngjs').PNG;
const colorGradient = require("javascript-color-gradient");

console.log('order arguments: inputFile width height fromColor toColor midPoints outputFile verbose');
const args = process.argv.slice(2);
console.log('arguments passed:', args);

const procPath = process.cwd();

const inputFile = args[0] ? args[0] : 'heightmap';
let width = args[1];
let height = args[2];
const fromColor = args[3] ? args[3] : '#3F2CAF';
const toColor = args[4] ? args[4] : '#e9446a';
const midPoints = args[5] ? args[5] : 10;
const outputFile = args[6] ? args[6] : inputFile + '.png';
const verbose = args[7] ? args[7] : false;

// default alpha channel
const alphaChannelDefault = 'FF';

// files
const inputPath = path.join(procPath, inputFile);
const outputPath = path.join(procPath, outputFile);
if(!fs.existsSync(inputPath)) throw new Error(`input file ${inputPath} not found`);

// read heightmap
var buffer = fs.readFileSync(inputPath);
const heightmap = buffer.toString().split(',').map(x => Number(x));

// default width and height
const [min, max] = getMinMaxFromHeightmap(heightmap);
if(width == undefined || height == undefined) {
    width = Math.floor(Math.sqrt(heightmap.length));
    height = Math.floor(heightmap.length / width);
}

console.info(
    `\tinputPath: ${inputPath}
    \twidth: ${width}
    \theight: ${height}
    \tfromColor: ${fromColor}
    \ttoColor: ${toColor}
    \tmidPoints: ${midPoints}
    \toutputPath: ${outputPath}
    \tverbose: ${verbose}`);

if(!(heightmap.length > 0)) throw new Error('heightmap error');
if(width * height != heightmap.length) throw new Error(`heightmap size error: width: ${width} height: ${height} heightmap: ${heightmap.length}`);

var png = new PNG({
    width: width,
    height: height,
    filterType: -1
});

for (var i = 0; i < png.height; i++) {
    for (var j = 0; j < png.width; j++) {
        var idx = (png.width * i + j) << 2;
        const value = heightmap[i*width+j];
        const color = mapColor(value, min, max, fromColor, toColor, midPoints);

        if(verbose) console.log(`i: ${i} j: ${j} idx: ${idx} valueIn: ${value} index: ${color}`);

        png.data.write(color.substring(1,3), idx, 'hex');
        png.data.write(color.substring(3,5), idx+1, 'hex');
        png.data.write(color.substring(5,7), idx+2, 'hex');
        png.data.write(alphaChannelDefault, idx+3, 'hex');
    }
}

png.pack().pipe(fs.createWriteStream(outputPath));
if(verbose) console.log(`successfully created heightmap ${outputPath}`);



// external functions -----------------------------

function mapRange(valueIn, min1, max1, min2, max2){
    const tot1 = Math.abs(min1 - max1);
    const delta1 = Math.abs(valueIn - min1)
    const ratio1 = delta1 / tot1;

    const tot2 = Math.abs(max2 - min2);
    const valueOut = tot2 * ratio1;
    return Math.floor(valueOut);
};

function mapColor(valueIn, min, max, fromColor, toColor, midPoints){
    const gradientArray = colorGradient.setGradient(fromColor, toColor).setMidpoint(midPoints).getArray();
    const index = mapRange(valueIn, min, max, 1, gradientArray.length);
    return gradientArray[index];
}

function getMinMaxFromHeightmap(heightmap){
    const max = Math.max(...heightmap);
    const min = Math.min(...heightmap);
    return [min, max];
}