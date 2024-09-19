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
    const polygonCount = 10;
    let polygons = [];
    const limit = 10;
    for (let i = 0; i < polygonCount; ++i) {
        const shift = i * limit;
        polygons.push(GenerateTriangle([
            [shift, shift], 
            [shift + limit, shift + limit]
        ]));
    }
    const pixelCountInCoordinates = [20, 20];
    const pixelSizesInCoordinates = [
        1 / pixelCountInCoordinates[0],
        1 / pixelCountInCoordinates[1]
    ];
    // const rasterLimit = [[0, 0], [polygonCount * limit, polygonCount * limit]];
    await RaptorFunc(polygons, fId, raster, pixelSizesInCoordinates, true);
    console.log(polygons);
}

Test(0, 0);