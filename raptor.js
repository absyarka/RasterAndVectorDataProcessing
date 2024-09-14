"use strict";

function processLinesWithWorkers(lines, polygon, pixelSizesInCoordinates, numWorkers) {
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

            worker.postMessage({ lines: linesChunk, polygon: polygon, pixelSizesInCoordinates: pixelSizesInCoordinates });
        }
    });
}

function getLinesArray(yMax, yMin, numWorkers, stepY) {
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

async function getPoints(polygon, pixelSizesInCoordinates, numWorkers) {
    const N = polygon.length;
    const stepY = pixelSizesInCoordinates[0];

    let yMax = polygon[0][0];
    let yMin = polygon[0][0];
    for (let i = 1; i < N; ++i) {
        yMax = Math.max(yMax, polygon[i][0]);
        yMin = Math.min(yMin, polygon[i][0]);
    }
    let lines = getLinesArray(yMax, yMin, numWorkers, stepY);
    return await processLinesWithWorkers(lines, polygon, pixelSizesInCoordinates, numWorkers).then(results => { return results; }).catch(error => { console.error(error); });
}

function isClockwise(polygon) {
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

async function raptorFunc(polygon, pixelSizesInCoordinates, log_result=false) {
    if (polygon.length == 0) {}
    if (polygon[0] == polygon[polygon.length - 1])
    if (isClockwise(polygon)) {
        polygon.reverse();
    } // the polygon verteces go counterclockwise
    const numWorkers = navigator.hardwareConcurrency;
    let pointsList = await getPoints(polygon, pixelSizesInCoordinates, numWorkers);
    if (log_result) {
        console.log(pointsList);
    }
    return pointsList;
}

raptorFunc([[0, 4], [2, 3], [2, 5], [3, 6], [3, 3], [6, 5], [1, 7], [8, 5], [2, 0], [3, 2]], [0.1, 0.1], true);
