"use strict";

function id2cord(pos, shapes, matrixSizes) {
    return [shapes[0][0] + 0.5 + pos[0] * (shapes[0][1] - shapes[0][0]) / (matrixSizes[0] - 1),
    shapes[1][0] + 0.5 + pos[1] * (shapes[1][1] - shapes[1][0]) / (matrixSizes[1] - 1)];
}

function cord2id(pos, shapes, matrixSizes) {
    return [Math.floor(0.5 + (pos[0] - shapes[0][0]) * (matrixSizes[0] - 1) / (shapes[0][1] - shapes[0][0])),
    Math.floor(0.5 + (pos[1] - shapes[1][0]) * (matrixSizes[1] - 1) / (shapes[1][1] - shapes[1][0]))];
}

function processLinesWithWorkers(lines, polygon, numWorkers) {
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

            worker.postMessage({ lines: linesChunk, polygon: polygon });
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

async function getSegments(polygon, shapes, matrixSizes, numWorkers) {
    const N = polygon.length;
    // const stepY = Math.abs(id2cord([0, 0], shapes, matrixSizes)[0] - id2cord([1, 0], shapes, matrixSizes)[0]);
    const stepY = 0.5;
    const stepX = Math.abs(id2cord([0, 0], shapes, matrixSizes)[1] - id2cord([0, 1], shapes, matrixSizes)[1]);

    let yMax = polygon[0][0];
    let yMin = polygon[0][0];
    for (let i = 1; i < N; ++i) {
        yMax = Math.max(yMax, polygon[i][0]);
        yMin = Math.min(yMin, polygon[i][0]);
    }
    let lines = getLinesArray(yMax, yMin, numWorkers, stepY);
    return await processLinesWithWorkers(lines, polygon, numWorkers).then(results => { return results; }).catch(error => { console.error(error); });
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

function formResultString(segmentsList) {
    let result = "";
    for (let i = 0; i < segmentsList.length; ++i) {
        const y = segmentsList[i].y;
        const x1 = segmentsList[i].x1;
        let x2 = segmentsList[i].x2;
        result += "y, x1, x2 : " + String(y) + "      " + String(x1) + "      " + String(x2) + "\n";
    }
    return result;
}

async function raptorFunc(data, polygon, shapes) {
    if (isClockwise(polygon)) {
        polygon.reverse();
    } // the polygon verteces go counterclockwise
    const n = data.length;
    if (n == 0) {
        return "";
    }
    const m = data[0].length;
    const numWorkers = navigator.hardwareConcurrency;
    let segmentsList = await getSegments(polygon, shapes, [n, m], numWorkers);
    return formResultString(segmentsList);
}

async function fillPage() {
    var p = document.getElementById("paragraphId");
    p.textContent = await raptorFunc([[0.3, 0.4], [0.1, 0.2]],
        [[0, 4], [2, 3], [2, 5], [3, 6], [3, 3], [6, 5], [1, 7], [8, 5], [2, 0], [3, 2]], [[-85.6, 85.6], [-180, 180]]);
}

fillPage();