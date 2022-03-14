// https://www.npmjs.com/package/javascript-color-gradient
var colorGradient = require("javascript-color-gradient");

const gradientArray = colorGradient.setGradient("#3F2CAF", "e9446a").getArray();

console.log(gradientArray);