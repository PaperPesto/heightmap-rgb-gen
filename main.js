#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('pngjs');
const Gradient = require('javascript-color-gradient');

const DEFAULTS = {
    inputFile: 'heightmap',
    fromColor: '#3F2CAF',
    toColor: '#e9446a',
    midPoints: 10,
};

try {
    main(process.argv.slice(2));
} catch (err) {
    console.error(`error: ${err.message}`);
    process.exitCode = 1;
}

function main(args) {
    console.log('order arguments: inputFile width height fromColor toColor midPoints outputFile verbose');
    console.log('arguments passed:', args);

    const inputFile = args[0] || DEFAULTS.inputFile;
    const fromColor = normalizeHexColor(args[3] || DEFAULTS.fromColor, 'fromColor');
    const toColor = normalizeHexColor(args[4] || DEFAULTS.toColor, 'toColor');
    const midPoints = args[5] ? parseInteger(args[5], 'midPoints', 2) : DEFAULTS.midPoints;
    const outputFile = args[6] || inputFile + '.png';
    const verbose = Boolean(args[7]) && args[7] !== 'false' && args[7] !== '0';

    const inputPath = path.resolve(process.cwd(), inputFile);
    const outputPath = path.resolve(process.cwd(), outputFile);
    if (!fs.existsSync(inputPath)) throw new Error(`input file ${inputPath} not found`);

    const heightmap = parseHeightmap(fs.readFileSync(inputPath, 'utf8'));
    if (heightmap.length === 0) throw new Error(`heightmap ${inputPath} is empty`);

    // width and height default to the largest square that fits the heightmap
    let width, height;
    if (args[1] !== undefined && args[2] !== undefined) {
        width = parseInteger(args[1], 'width', 1);
        height = parseInteger(args[2], 'height', 1);
    } else {
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

    if (width * height !== heightmap.length) {
        throw new Error(`heightmap size error: width: ${width} height: ${height} heightmap: ${heightmap.length}`);
    }

    const palette = buildPalette(fromColor, toColor, midPoints);
    const [min, max] = getMinMax(heightmap);

    const png = new PNG({ width, height, filterType: -1 });

    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            const idx = (width * i + j) << 2;
            const value = heightmap[i * width + j];
            const colorIndex = mapToIndex(value, min, max, palette.length);
            const [r, g, b] = palette[colorIndex];

            if (verbose) console.log(`i: ${i} j: ${j} idx: ${idx} valueIn: ${value} color: ${toHex(r, g, b)}`);

            png.data[idx] = r;
            png.data[idx + 1] = g;
            png.data[idx + 2] = b;
            png.data[idx + 3] = 0xff; // opaque alpha channel
        }
    }

    fs.writeFileSync(outputPath, PNG.sync.write(png));
    console.log(`successfully created heightmap ${outputPath}`);
}


// helpers -----------------------------------------

/**
 * Parses numbers separated by commas and/or whitespace (newlines included).
 */
function parseHeightmap(content) {
    const tokens = content.split(/[\s,]+/).filter(token => token !== '');
    return tokens.map((token, position) => {
        const value = Number(token);
        if (!Number.isFinite(value)) {
            throw new Error(`invalid value "${token}" at position ${position} of the heightmap`);
        }
        return value;
    });
}

function parseInteger(raw, name, minValue) {
    const value = Number(raw);
    if (!Number.isInteger(value) || value < minValue) {
        throw new Error(`${name} must be an integer >= ${minValue}, got "${raw}"`);
    }
    return value;
}

/**
 * Accepts "#rrggbb", "rrggbb", "#rgb" or "rgb" and returns "#rrggbb" (lowercase).
 */
function normalizeHexColor(raw, name) {
    const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(raw).trim());
    if (!match) throw new Error(`${name} must be a hex color like "#3f2caf", got "${raw}"`);
    let hex = match[1].toLowerCase();
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    return '#' + hex;
}

/**
 * Returns the gradient as an array of [r, g, b] triplets, from fromColor to toColor.
 */
function buildPalette(fromColor, toColor, midPoints) {
    return new Gradient()
        .setColorGradient(fromColor, toColor)
        .setMidpoint(midPoints)
        .getColors()
        .map(color => [1, 3, 5].map(start => parseInt(color.slice(start, start + 2), 16)));
}

/**
 * Maps a value in [min, max] to an index in [0, length - 1].
 */
function mapToIndex(value, min, max, length) {
    if (max === min) return 0;
    const ratio = (value - min) / (max - min);
    return Math.min(length - 1, Math.floor(ratio * (length - 1)));
}

// a plain loop instead of Math.min(...array): spreading large heightmaps overflows the call stack
function getMinMax(values) {
    let min = Infinity;
    let max = -Infinity;
    for (const value of values) {
        if (value < min) min = value;
        if (value > max) max = value;
    }
    return [min, max];
}

function toHex(r, g, b) {
    return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}
