"use stricts";

function GetRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function GeneratePolygon(N, borders) {
    let points = [];
    for (let i = 0; i < N; ++i) {
        const y = GetRandomArbitrary(borders[0][0], borders[1][0]);
        const x = GetRandomArbitrary(borders[0][1], borders[1][1]);
        points.push([y, x]);
    }
    return points;
}

function GetVector(from, to) {
    return [to[0] - from[0], to[1] - from[1]];
}

function GetVectorProduct(a, b) {
    return a[0] * b[1] - a[1] * b[0];
}

function EqualFloat(a, b, EPS) {
    return Math.abs(a - b) < EPS;
}

function LessFloat(a, b, EPS) {
    return !EqualFloat(a, b, EPS) && (a < b);
}

function IsPointInTriangle(point, triangle) {
    const EPS = 1e-7;
    const OA = GetVector(point, triangle[0]);
    const OB = GetVector(point, triangle[1]);
    const OC = GetVector(point, triangle[2]);
    const vectorProducts = [GetVectorProduct(OA, OB), GetVectorProduct(OB, OC), GetVectorProduct(OC, OA)];
    let lessZero = 0;
    for (let i = 0; i < vectorProducts.length; ++i) {
        if (EqualFloat(vectorProducts[i], 0, EPS)) {
            return true;
        }
        if (LessFloat(vectorProducts[i], 0, EPS)) {
            ++lessZero;
        }
    }
    return (lessZero == 0) || (lessZero == vectorProducts.length);
}

async function Test() {
    const polygonCount = 10;
    let polygons = [];
    const limit = 10;
    for (let i = 0; i < polygonCount; ++i) {
        const shift = i * limit;
        polygons.push(GeneratePolygon(3, [[shift, shift], [shift + limit, shift + limit]]));
    }
    const pixelCountInCoordinates = [20, 20];
    const pixelSizesInCoordinates = [1 / pixelCountInCoordinates[0], 1 / pixelCountInCoordinates[1]];
    const rasterLimit = [[0, 0], [polygonCount * limit, polygonCount * limit]];
    let correctAns = 0;
    for (let y = rasterLimit[0][0]; y < rasterLimit[1][0]; y += pixelSizesInCoordinates[0]) {
        for (let x = rasterLimit[0][1]; x < rasterLimit[1][1]; x += pixelSizesInCoordinates[1]) {
            let flag = false;
            for (let polygonId = 0; polygonId < polygonCount; ++polygonId) {
                const polygon = polygons[polygonId];
                if (IsPointInTriangle([y, x], polygon)) {
                    flag = true;
                }
            }
            if (flag) {
                ++correctAns;
            }
        }
    }
    const rasterSizes = [(rasterLimit[1][0] - rasterLimit[0][0]) * pixelCountInCoordinates[0], (rasterLimit[1][1] - rasterLimit[0][1]) * pixelCountInCoordinates[1], 2];
    let raster = new Array(rasterSizes[0]);
    for (let i = 0; i < rasterSizes[0]; ++i) {
        raster[i] = new Array(rasterSizes[1]);
        for (let j = 0; j < rasterSizes[1]; ++j) {
            raster[i][j] = new Array(rasterSizes[2]);
            for (let k = 0; k < rasterSizes[2]; ++k) {
                raster[i][j][k] = GetRandomArbitrary(0, 100);
            }
        }
    }
    console.log(100 * ((await RaptorFunc(polygons, pixelSizesInCoordinates)).length - correctAns) / correctAns);
    console.log(polygons);
}

Test();