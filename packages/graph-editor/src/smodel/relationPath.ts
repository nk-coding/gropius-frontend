import { Point, Bounds } from "sprotty-protocol";
import { SegmentLayout } from "../gropiusModel";
import { LineEngine } from "../line/engine/lineEngine";
import { SIssueAffected } from "./sIssueAffected";
import { SRelation } from "./sRelation";

export type RelationPathSegment =
    | {
          y: number;
          x?: undefined;
          start: Point;
      }
    | {
          x: number;
          y?: undefined;
          start: Point;
      };

export interface RelationPath {
    start: Point;
    end: Point;
    segments: RelationPathSegment[];
}

export namespace RelationPath {
    export function fromRelation(relation: SRelation): RelationPath | null {
        if (relation.start == undefined || relation.end == undefined) {
            return null;
        }
        const segments: RelationPathSegment[] = [];
        let startProjectionPoint: Point;
        if (relation.points.length > 0) {
            startProjectionPoint = relation.points[0];
        } else {
            if (typeof relation.end === "string") {
                const end = relation.root.index.getById(relation.end) as SIssueAffected;
                startProjectionPoint = Bounds.center(end.shape.bounds);
            } else {
                startProjectionPoint = relation.end;
            }
        }
        const start = relation.root.index.getById(relation.start) as SIssueAffected;
        const startShape = start.shape;
        const startPoint = LineEngine.DEFAULT.projectPointOrthogonalWithPrecision(
            startProjectionPoint,
            startShape.outline,
            relation.segments[0]
        ).point;

        let prevPoint = startPoint;
        for (let i = 0; i < relation.points.length; i++) {
            const point = relation.points[i];
            const segment = relation.segments[i];
            segments.push(...createSegments(prevPoint, point, segment));
            prevPoint = point;
        }

        let endPoint: Point;
        if (typeof relation.end === "string") {
            let endProjectionPoint: Point;
            if (relation.points.length > 0) {
                endProjectionPoint = relation.points.at(-1)!;
            } else {
                endProjectionPoint = startPoint;
            }
            const end = relation.root.index.getById(relation.end) as SIssueAffected;
            const endShape = end.shape;
            endPoint = LineEngine.DEFAULT.projectPointOrthogonalWithPrecision(
                endProjectionPoint,
                endShape.outline,
                SegmentLayout.invert(relation.segments.at(-1)!)
            ).point;
        } else {
            endPoint = relation.end;
        }
        segments.push(...createSegments(prevPoint, endPoint, relation.segments.at(-1)!));
        return RelationPath.simplify({ start: startPoint, end: endPoint, segments });
    }

    function createSegments(startPoint: Point, point: Point, layout: SegmentLayout): RelationPathSegment[] {
        if (layout == SegmentLayout.HORIZONTAL_VERTICAL) {
            return [
                {
                    y: point.y,
                    start: startPoint
                },
                {
                    x: point.x,
                    start: { x: startPoint.x, y: point.y }
                }
            ];
        } else {
            return [
                {
                    x: point.x,
                    start: startPoint
                },
                {
                    y: point.y,
                    start: { x: point.x, y: startPoint.y }
                }
            ];
        }
    }

    export function simplify(path: RelationPath): RelationPath {
        const segments = simplifyPath(path.start, path.segments);
        if (segments.length == 0) {
            segments.push({ x: 0, start: path.start });
        }
        return { start: path.start, end: path.end, segments };
    }

    export function simplifyPath<T extends Omit<RelationPathSegment, "start">>(start: Point, path: T[]): T[] {
        const segments: T[] = [];
        const lastPoint = { x: start.x, y: start.y };
        for (const segment of path) {
            const lastSegment = segments.at(-1);
            if (segment.x != lastPoint.x && segment.x != undefined) {
                if (lastSegment?.x != undefined) {
                    lastSegment.x = segment.x;
                } else {
                    segments.push(segment);
                }
                lastPoint.x = segment.x;
            }

            if (segment.y != lastPoint.y && segment.y != undefined) {
                if (lastSegment?.y != undefined) {
                    lastSegment.y = segment.y;
                } else {
                    segments.push(segment);
                }
                lastPoint.y = segment.y;
            }
        }
        return segments;
    }

    export function segmentCenter(segment: RelationPathSegment): Point {
        if (segment.x != undefined) {
            return {
                x: (segment.start.x + segment.x) / 2,
                y: segment.start.y
            };
        } else {
            return {
                x: segment.start.x,
                y: (segment.start.y + segment.y) / 2
            };
        }
    }

    export function segmentEnd(segment: RelationPathSegment): Point {
        if (segment.x != undefined) {
            return {
                x: segment.x,
                y: segment.start.y
            };
        } else {
            return {
                x: segment.start.x,
                y: segment.y
            };
        }
    }
}
