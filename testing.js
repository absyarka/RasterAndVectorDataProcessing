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

function AverageValue(points, raster, pixelSizesInCoordinates) {
    const pixelCountInCoordinates = [Math.round(1 / pixelSizesInCoordinates[0]), Math.round(1 / pixelSizesInCoordinates[1])];
    console.log("points to agregate count: ", points.length);
    let rasterSizes = raster["sizes"];
    let arr = raster["raster"];
    let sumValues = [];
    for (let i = 0; i < rasterSizes[2]; ++i) {
        sumValues.push(0);
    }
    for (let pointId = 0; pointId < points.length; ++pointId) {
        const point = points[pointId];
        let id = [
            Math.floor(point[0] * pixelCountInCoordinates[0]),
            Math.floor(point[1] * pixelCountInCoordinates[1])
        ];
        if (id[0] == arr.length) {
            --id[0];
        }
        if (id[1] == arr[0].length) {
            --id[1];
        }
        for (let i = 0; i < rasterSizes[2]; ++i) {
            sumValues[i] += arr[id[0]][id[1]][i];
        }
    }
    for (let i = 0; i < rasterSizes[2]; ++i) {
        sumValues[i] /= points.length;
    }
    return sumValues;
}

function IsPointInSegment(P, A, B) {
    const EPSILON = 1e-6;
    const y = P[0];
    const x = P[1];
    const y1 = A[0];
    const x1 = A[1];
    const y2 = B[0];
    const x2 = B[1];
    const dist1 = Math.sqrt((y1 - y) * (y1 - y) + (x1 - x) * (x1 - x));
    const dist2 = Math.sqrt((y2 - y) * (y2 - y) + (x2 - x) * (x2 - x));
    const dist3 = Math.sqrt((y2 - y1) * (y2 - y1) + (x2 - x1) * (x2 - x1));
    if (Math.abs(dist1 + dist2 - dist3) < EPSILON) {
        return true;
    }
}

function GetLineFromPoints(X, Y) {
    let y1 = X[0];
    let x1 = X[1];
    let y2 = Y[0];
    let x2 = Y[1];
    let A = y2 - y1;
    let B = x1 - x2;
    let C = -A * x1 - B * y1;
    return [A, B, C];
}

function GetLinesIntersection(X, Y, Z, T) {
    const EPSILON = 1e-6;
    let [A, B, C] = GetLineFromPoints(X, Y);
    let [a, b, c] = GetLineFromPoints(Z, T);
    let denom = B * a - A * B;
    if (Math.abs(denom) < EPSILON) {
        return undefined;
    }
    return [(c * A - C * a) / denom, (b * C - c * B) / denom];
}

function PrimitiveAlgorithm(polygons, raster, pixelSizesInCoordinates) {
    let result = [];
    for (let polygonId = 0; polygonId < polygons.length; ++polygonId) {
        let resultPoints = [];
        let polygon = polygons[polygonId];
        const N = polygon.length;
        for (let y = 0; y < raster["sizes"][0]; y += pixelSizesInCoordinates[0]) {
            for (let x = 0; x < raster["sizes"][1]; x += pixelSizesInCoordinates[1]) {
                for (let i = 0; i < N; ++i) {
                    if (IsPointInSegment([y, x], polygon[i], polygon[(i + 1) % N])) {
                        resultPoints.push([y, x]);
                        break;
                    }
                }
                if (resultPoints.length > 0 && resultPoints[resultPoints.length - 1] == [y, x]) {
                    continue;
                }
                let cnt = 0;
                for (let i = 0; i < N; ++i) {
                    let O = [y, x];
                    let C = [y, x + 1];
                    let A = polygon[i];
                    let B = polygon[(i + 1) % N];
                    let I = GetLinesIntersection(O, C, A, B);
                    if (I == undefined) {
                        continue;
                    }
                    if ((IsPointInSegment(I, O, C) || IsPointInSegment(C, O, I)) && IsPointInSegment(I, A, B)) {
                        ++cnt;
                    }
                }
                if (cnt % 2) {
                    resultPoints.push([y, x]);
                }
            }
        }
        result.push(AverageValue(resultPoints, raster, pixelSizesInCoordinates));
    }
    return result;
}

async function Test(fId) {
    if (fId == 0) {
        const polygonCount = 50;
        let polygons = [];
        const limit = 50;
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
        console.log("polygons count: ", polygons.length);
        console.log("max possible area: ", limit, " x ", limit);
        console.log("pixelSizesInCoordinates", pixelSizesInCoordinates);
        let startTime = new Date();
        await RaptorFunc(polygons, fId, undefined, pixelSizesInCoordinates, false);
        let endTime = new Date();
        console.log("result on ", Math.max(1, navigator.hardwareConcurrency - 2), " threads: ", endTime - startTime);
        startTime = new Date();
        await RaptorFunc(polygons, fId, undefined, pixelSizesInCoordinates, false, 1);
        endTime = new Date();
        console.log("result on ", 1, " thread: ", endTime - startTime);
        return;
    }
    let polygonCount = 1;
    let limit = 8;
    let testPolygon = [[0, 4], [2, 3], [2, 5], [3, 6], [3, 3], [6, 5], [1, 7], [8, 5], [2, 0], [3, 2]];
    let polygons = [testPolygon];
    const pixelCountInCoordinates = [30, 30];
    const pixelSizesInCoordinates = [
        1 / pixelCountInCoordinates[0],
        1 / pixelCountInCoordinates[1]
    ];
    const rasterLimit = [[0, 0], [polygonCount * limit, polygonCount * limit]];
    const rasterSizes = [
        (rasterLimit[1][0] - rasterLimit[0][0]) * pixelCountInCoordinates[0],
        (rasterLimit[1][1] - rasterLimit[0][1]) * pixelCountInCoordinates[1],
        2
    ];
    console.log("rasterSizes: ", rasterSizes);
    let raster = new Array(rasterSizes[0]);
    for (let i = 0; i < rasterSizes[0]; ++i) {
        raster[i] = new Array(rasterSizes[1]);
        for (let j = 0; j < rasterSizes[1]; ++j) {
            raster[i][j] = new Array(rasterSizes[2]);
            for (let k = 0; k < rasterSizes[2]; ++k) {
                raster[i][j][k] = (i + j) * (k ? 1 : i + j);
            }
        }
    }
    let rasterJSON = {"raster": raster, "sizes": rasterSizes};
    let primitiveResult = PrimitiveAlgorithm(polygons, rasterJSON, pixelSizesInCoordinates);
    let RZSResult = await RaptorFunc(polygons, 1, rasterJSON, pixelSizesInCoordinates, false, navigator.hardwareConcurrency);
    console.log("correctAns: ", primitiveResult);
    console.log("RZSAns: ", RZSResult);
    let diff = [];
    for (let i = 0; i < rasterSizes[2]; ++i) {
        diff.push(100 * Math.abs(RZSResult[0][i] - primitiveResult[0][i]) / primitiveResult[0][i]);
    }
    console.log("difference (%): ", diff[0]);
    console.log("difference (%): ", diff[1]);
}

Test(0);
Test(1);
