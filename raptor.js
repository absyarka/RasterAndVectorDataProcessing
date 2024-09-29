"use strict";

async function ProcessWithWorkers(polygons, fId, raster, pixelSizesInCoordinates, numWorkers) {
    const workers = [];
    let results = [];
    let cnt = 0;
    return new Promise((resolve, reject) => {
        for (let i = 0; i < numWorkers; i++) {
            const worker = new Worker('worker_raptor.js');
            const polygonsChunk = [];
            for (let j = i; j < polygons.length; j += numWorkers) {
                polygonsChunk.push(polygons[j]);
            }
            workers.push(worker);

            worker.onmessage = function (e) {
                const {workerResults, workerId} = e.data;
                results.push([workerResults, workerId]);
                ++cnt;
                worker.terminate();
                if (cnt == numWorkers) {
                    resolve(results);
                }
            };

            worker.onerror = function (err) {
                reject(err);
            };

            worker.postMessage({ workerId: i, polygons: polygonsChunk, fId: fId, raster: raster, pixelSizesInCoordinates: pixelSizesInCoordinates });
        }
    });
}

async function GetResults(polygons, fId, raster, pixelSizesInCoordinates, numWorkers) {
    if (numWorkers > polygons.length) {
        numWorkers = polygons.length;
    }
    let results = await ProcessWithWorkers(polygons, fId, raster, pixelSizesInCoordinates, numWorkers);
    let result = [];
    let ids = [];
    for (let i = 0; i < numWorkers; ++i) {
        ids.push(0);
    }
    for (let cnt = 0; cnt < polygons.length; ++cnt) {
        for (let id = 0; id < numWorkers; ++id) {
            if (results[id][1] == (cnt % numWorkers)) {
                result.push(results[id][0][ids[id]]);
                ++ids[id];
            }
        }
    }
    return result;
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

function MakeResult(resultList, logResult) {
    if (logResult) {
        console.log(resultList);
    }
    return resultList;
}

async function RaptorFunc(polygons, fId, raster, pixelSizesInCoordinates, logResult=false, numWorkers=Math.max(navigator.hardwareConcurrency - 2, 1)) {
    PrepareVector(polygons);
    let resultList = await GetResults(polygons, fId, raster, pixelSizesInCoordinates, numWorkers);
    return MakeResult(resultList, logResult);
}
