"use strict";

function EdgeCoordinates(points, raster, pixelSizesInCoordinates) {
    let ma = [points[0][0], points[0][1]];
    let mi = [points[0][0], points[0][1]];
    for (let i = 1; i < points.length; ++i) {
        ma[0] = Math.max(ma[0], points[i][0]);
        ma[1] = Math.max(ma[1], points[i][1]);
        mi[0] = Math.min(mi[0], points[i][0]);
        mi[1] = Math.min(mi[1], points[i][1]);
    }
    return [ma, mi];
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

const f = [EdgeCoordinates, AverageValue];

class KSegment {
    constructor(y, x1, x2) {
        this.y = y;
        this.x1 = x1;
        this.x2 = x2;
    }
}

function GetEdges(polygon) {
    let yMax = polygon[0][0];
    let yMin = polygon[0][0];
    const n = polygon.length;

    for (let i = 1; i < n; ++i) {
        yMax = Math.max(yMax, polygon[i][0]);
        yMin = Math.min(yMin, polygon[i][0]);
    }

    return [yMax, yMin];
}

function GetLines(edges, pixelSizesInCoordinates) {
    const stepY = pixelSizesInCoordinates[0];
    let results = [];
    for (let y = edges[0]; y >= edges[1]; y -= stepY) {
        results.push(y);
    }
    return results;
}

self.onmessage = function (e) {
    const { workerId, polygons, fId, raster, pixelSizesInCoordinates } = e.data;
    let results = [];
    polygons.forEach(polygon => {
        const edges = GetEdges(polygon);
        const lines = GetLines(edges, pixelSizesInCoordinates);
        let totalPoints = [];
        lines.forEach(y => {
            const lineIntersections = CalculateIntersections(y, polygon);
            const points = GetPointsFromLines(lineIntersections, pixelSizesInCoordinates);
            totalPoints.push(...points);
        });
        const agregateResult = f[fId](totalPoints, raster, pixelSizesInCoordinates);
        results.push(agregateResult);
    });
    self.postMessage({workerResults: results, workerId: workerId});
};

function IsNextSegmentInside(A, B, C, D) {
    const EPSILON = 1e-9;
    let ABx = B[1] - A[1];
    let ABy = B[0] - A[0];
    let ACx = C[1] - A[1];
    let ACy = C[0] - A[0];
    let ADx = D[1] - A[1];
    let ADy = D[0] - A[0];
    let CAD = Math.atan2(ACx * ADy - ACy * ADx, ACx * ADx + ACy * ADy);
    if (CAD < -EPSILON) {
        CAD = 2 * Math.PI + CAD;
    }
    let CAB = Math.atan2(ACx * ABy - ACy * ABx, ACx * ABx + ACy * ABy);
    if (CAB < -EPSILON) {
        CAB = 2 * Math.PI + CAB;
    }
    return CAB < CAD;
}

function CalculateIntersections(y, polygon) {
    let segments = [];
    if (polygon == undefined) {
        return [];
    }
    const N = polygon.length;
    let intersectionPos = [];
    let vertexId = new Map();
    for (let i = 0; i < N; ++i) {
        if (polygon[i][0] == y) {
            vertexId[Number(polygon[i][1])] = i;
        }
        const x1 = polygon[i][1];
        const y1 = polygon[i][0];
        const x2 = polygon[(i + 1) % N][1];
        const y2 = polygon[(i + 1) % N][0];

        const miY = Math.min(y1, y2);
        const maY = Math.max(y1, y2);
        if (y < miY || y > maY) {
            continue;
        }

        if (y1 == y) {
            intersectionPos.push(x1);
        }

        if (y1 == y || y2 == y || y1 == y2) {
            continue;
        }

        const A = y2 - y1;
        const B = x1 - x2;
        const C = (y1 - y2) * x1 + (x2 - x1) * y1;
        const x = (-C - B * y) / A;
        const miX = Math.min(x1, x2);
        const maX = Math.max(x1, x2);
        if (x >= miX && x <= maX) {
            intersectionPos.push(x);
        }
    }
    let vertexIdKeysTmp = Object.keys(vertexId);
    let vertexIdKeys = [];
    for (let i = 0; i < vertexIdKeysTmp.length; ++i) {
        vertexIdKeys.push(Number(vertexIdKeysTmp[i]));
    }
    intersectionPos.sort((a, b) => a - b);
    intersectionPos = [...new Set(intersectionPos)];
    const K = intersectionPos.length;
    if (K == 1) {
        segments.push(new KSegment(y, intersectionPos[0], intersectionPos[0]));
        return segments;
    }
    let flags = Array.from({ length: K }, (v, i) => 0);
    flags[0] = -1;
    for (let i = 0; i < K - 1; ++i) {
        if (vertexIdKeys.includes(intersectionPos[i])) {
            let id = vertexId[intersectionPos[i]];
            let A = polygon[id];
            let B = polygon[(id + 1) % N];
            let C = polygon[(id + N - 1) % N];
            let D = [A[0], A[1] + 1];
            if (intersectionPos[i + 1] == C[1] || intersectionPos[i + 1] == B[1]) {
                flags[i + 1] = 1;
                segments.push(new KSegment(y, intersectionPos[i], intersectionPos[i + 1]));
                continue;
            }
            if (IsNextSegmentInside(A, B, C, D)) {
                flags[i + 1] = 1;
                segments.push(new KSegment(y, intersectionPos[i], intersectionPos[i + 1]));
            } else {
                segments.push(new KSegment(y, Ax, Ax));
                flags[i + 1] = -1;
            }
        } else {
            flags[i + 1] = -flags[i];
            if (flags[i + 1] == 1) {
                segments.push(new KSegment(y, intersectionPos[i], intersectionPos[i + 1]));
            }
        }
    }
    if (vertexIdKeys.includes(intersectionPos[K - 1])) {
        segments.push(new KSegment(y, intersectionPos[K - 1], intersectionPos[K - 1]));
    }
    return MakePretty(segments);
}

function MakePretty(segments) {
    let result = [];
    for (let i = 0; i < segments.length; ++i) {
        const y = segments[i].y;
        const x1 = segments[i].x1;
        let x2 = segments[i].x2;
        while (i + 1 < segments.length && segments[i + 1].y == y && segments[i + 1].x1 == x2) {
            ++i;
            x2 = segments[i].x2;
        }
        result.push(new KSegment(y, x1, x2));
    }
    return result;
}

function GetPointsFromLines(lines, pixelSizesInCoordinates) {
    let result = [];
    const stepX = pixelSizesInCoordinates[1];
    for (let i = 0; i < lines.length; ++i) {
        const y = lines[i].y;
        const x1 = lines[i].x1;
        const x2 = lines[i].x2;
        for (let x = x1; x <= x2; x += stepX) {
            result.push([y, x]);
        }
    }
    return result;
}