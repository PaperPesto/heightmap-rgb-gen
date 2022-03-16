# heightmap-rgb-gen

Cli tool for generating heightmap from comma separated numbers

> [github](https://www.npmjs.com/package/heightmap-rgb-gen)  
> [npm](https://www.npmjs.com/package/heightmap-rgb-gen)

## Installation

Use the package manager [npm](https://www.npmjs.com/) to install heightmap-rgb-gen.

```bash
npm install heightmap-rgb-gen
```

## Usage

Save a file called *heightmap* with csv numbers inside and run

```bash
npx heightmap-rgb-gen
```

## Example
This file (*heightmap*)
```node
0,4,2,6,3,0,1,6,8
```
generates this 3x3 pixel png  
  
![alt text](https://github.com/PaperPesto/heightmap-rgb-gen/blob/main/heightmap.preview.png)

## Example 2
```bash
npx heightmap-rgb-gen heightmap.txt 10 10 'faf450' '0254ff' 10
```
Requires a 100 comma separated numbers inside *heightmap.txt* file. It generates a png image *heightmap.png* of 10x10 pixels with 10 colors from #faf450 to #0254ff.
