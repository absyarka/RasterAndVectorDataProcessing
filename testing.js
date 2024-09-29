"use stricts";

function GetRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function GenerateTriangle(borders) {
    const N = 3;
    let points = [];
    for (let i = 0; i < N; ++i) {
        const y = GetRandomArbitrary(borders[0][0], borders[1][0]);
        const x = GetRandomArbitrary(borders[0][1], borders[1][1]);
        points.push([y, x]);
    }
    return points;
}

async function Test(fId, raster) {
    const polygonCount = 500;
    let polygons = [];
    const limit = 10;
    for (let i = 0; i < polygonCount; ++i) {
        const shift = i * limit;
        polygons.push(GenerateTriangle([
            [shift, shift], 
            [shift + limit, shift + limit]
        ]));
    }
    const pixelCountInCoordinates = [100, 100];
    const pixelSizesInCoordinates = [
        1 / pixelCountInCoordinates[0],
        1 / pixelCountInCoordinates[1]
    ];
    console.log("pixelSizesInCoordinates", pixelSizesInCoordinates);
    let startTime = new Date();
    await RaptorFunc(polygons, fId, raster, pixelSizesInCoordinates, true);
    let endTime = new Date();
    console.log("result on ", navigator.hardwareConcurrency, " threads: ", endTime - startTime);
    startTime = new Date();
    await RaptorFunc(polygons, fId, raster, pixelSizesInCoordinates, true, true);
    endTime = new Date();
    console.log("result on 1 thread: ", endTime - startTime);
    console.log(polygons);
}

Test(0, 0);