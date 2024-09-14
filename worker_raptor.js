"use strict";

class Segment {
    constructor(y, x1, x2) {
        this.y = y;
        this.x1 = x1;
        this.x2 = x2;
    }
}

self.onmessage = function (e) {
    const { lines, polygon, pixelSizesInCoordinates } = e.data;
    const intersections = [];
    lines.forEach(y => {
        const lineIntersections = calculateIntersections(y, polygon);
        const points = getPointsFromLines(lineIntersections, pixelSizesInCoordinates);
        intersections.push(...points);
    });
    self.postMessage(intersections);
};

function calculateIntersections(y, polygon) {
    const EPSILON = 1e-9;
    const N = polygon.length;
    let vertexId = new Map();
    let intersectionPos = [];
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
    let vertexIdKeys1 = Object.keys(vertexId);
    let vertexIdKeys = [];
    for (let i = 0; i < vertexIdKeys1.length; ++i) {
        vertexIdKeys.push(Number(vertexIdKeys1[i]));
    }
    intersectionPos.sort((a, b) => a - b);
    intersectionPos = [...new Set(intersectionPos)];
    const K = intersectionPos.length;
    let segments = [];
    if (K == 1) {
        segments.push(new Segment(y, intersectionPos[0], intersectionPos[0]));
        return segments;
    }
    let flags = Array.from({ length: K }, (v, i) => 0);
    flags[0] = -1;
    for (let i = 0; i < K - 1; ++i) {
        if (vertexIdKeys.includes(intersectionPos[i])) {
            let id = vertexId[intersectionPos[i]];
            let Ax = polygon[id][1];
            let Ay = polygon[id][0];
            let Bx = polygon[(id + 1) % N][1];
            let By = polygon[(id + 1) % N][0];
            let Cx = polygon[(id + N - 1) % N][1];
            let Cy = polygon[(id + N - 1) % N][0];
            let Dx = Ax + 1;
            let Dy = Ay;
            let ABx = Bx - Ax;
            let ABy = By - Ay;
            let ACx = Cx - Ax;
            let ACy = Cy - Ay;
            let ADx = Dx - Ax;
            let ADy = Dy - Ay;
            let CAD = Math.atan2(ACx * ADy - ACy * ADx, ACx * ADx + ACy * ADy);
            if (CAD < -EPSILON) {
                CAD = 2 * Math.PI + CAD;
            }
            let CAB = Math.atan2(ACx * ABy - ACy * ABx, ACx * ABx + ACy * ABy);
            if (CAB < -EPSILON) {
                CAB = 2 * Math.PI + CAB;
            }
            if (intersectionPos[i + 1] == Cx || intersectionPos[i + 1] == Bx) {
                flags[i + 1] = 1;
                segments.push(new Segment(y, intersectionPos[i], intersectionPos[i + 1]));
                continue;
            }
            if (CAB < CAD) {
                flags[i + 1] = 1;
                segments.push(new Segment(y, intersectionPos[i], intersectionPos[i + 1]));
            } else {
                segments.push(new Segment(y, Ax, Ax));
                flags[i + 1] = -1;
            }
        } else {
            flags[i + 1] = -flags[i];
            if (flags[i + 1] == 1) {
                segments.push(new Segment(y, intersectionPos[i], intersectionPos[i + 1]));
            }
        }
    }
    if (vertexIdKeys.includes(intersectionPos[K - 1])) {
        segments.push(new Segment(y, intersectionPos[K - 1], intersectionPos[K - 1]));
    }
    return makePretty(segments);
}

function makePretty(segments) {
    let result = [];
    for (let i = 0; i < segments.length; ++i) {
        const y = segments[i].y;
        const x1 = segments[i].x1;
        let x2 = segments[i].x2;
        while (i + 1 < segments.length && segments[i + 1].y == y && segments[i + 1].x1 == x2) {
            ++i;
            x2 = segments[i].x2;
        }
        result.push(new Segment(y, x1, x2));
    }
    return result;
}

function getPointsFromLines(lines, pixelSizesInCoordinates) {
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