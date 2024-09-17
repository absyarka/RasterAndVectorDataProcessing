"use strict";

async function ProcessLinesWithWorkers(lines, polygons, pixelSizesInCoordinates, numWorkers) {
    const workers = [];
    let results = [];
    let cnt = 0;
    return new Promise((resolve, reject) => {
        for (let i = 0; i < numWorkers; i++) {
            const worker = new Worker('worker_raptor.js');
            const linesChunk = lines[i];
            workers.push(worker);

            worker.onmessage = function (e) {
                results.push(...e.data);
                ++cnt;
                worker.terminate();
                if (cnt === lines.length) {
                    resolve(results);
                }
            };

            worker.onerror = function (err) {
                reject(err);
            };

            worker.postMessage({ lines: linesChunk, polygons: polygons, pixelSizesInCoordinates: pixelSizesInCoordinates });
        }
    });
}

function GetLinesArray(yMax, yMin, numWorkers, stepY) {
    const lines = [];
    for (let i = 0; i < numWorkers; ++i) {
        lines.push(Array());
    }
    let tmp = 0;
    for (let y = yMax; y >= yMin; y -= stepY) {
        lines[tmp].push(y);
        ++tmp;
        if (tmp >= numWorkers) {
            tmp = 0;
        }
    }
    return lines;
}

async function GetPoints(polygons, pixelSizesInCoordinates) {
    let yMax = polygons[0][0][0];
    let yMin = polygons[0][0][0];
    const stepY = pixelSizesInCoordinates[0];

    for (let polygonId = 0; polygonId < polygons.length; ++polygonId) {
        const polygon = polygons[polygonId];
        const n = polygon.length;
    
        for (let i = 1; i < n; ++i) {
            yMax = Math.max(yMax, polygon[i][0]);
            yMin = Math.min(yMin, polygon[i][0]);
        }
    }

    const numWorkers = navigator.hardwareConcurrency;
    let lines = GetLinesArray(yMax, yMin, numWorkers, stepY);
    return await ProcessLinesWithWorkers(lines, polygons, pixelSizesInCoordinates, numWorkers);
}

function IsClockwise(polygon) {
    const N = polygon.length;
    let sum = 0;
    for (let i = 0; i < N; ++i) {
        let Ax = polygon[i][1];
        let Ay = polygon[i][0];
        let Bx = polygon[(i + 1) % N][1];
        let By = polygon[(i + 1) % N][0];
        sum += Ax * By - Ay * Bx;
    }
    return (sum < 0);
}

function PrepareVector(polygons) {
    for (let polygonId = 0; polygonId < polygons.length; ++polygonId) {
        let polygon = polygons[polygonId];
        if (polygon.length > 0 && polygon[0] == polygon[polygon.length - 1]) {
            polygon.pop();
        }
        if (polygon.length < 3) {
            polygon = undefined;
            return;
        }
        if (IsClockwise(polygon)) {
            polygon.reverse();
        } // the polygon verteces go counterclockwise
    }
}

function MakeResult(pointsList, logResult) {
    if (logResult) {
        console.log(pointsList);
    }
    return pointsList;
}

async function RaptorFunc(polygons, pixelSizesInCoordinates, logResult=false) {
    PrepareVector(polygons);
    if (polygons == undefined) {
        return [];
    }
    let pointsList = await GetPoints(polygons, pixelSizesInCoordinates);
    return MakeResult(pointsList, logResult);
}
