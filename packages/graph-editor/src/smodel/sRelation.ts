import { RelationStyle, SegmentLayout } from "../gropiusModel";
import { Relation } from "../model/relation";
import { SSelectable } from "./sSelectable";
import { Bounds, Point } from "sprotty-protocol";
import { SIssueAffected } from "./sIssueAffected";
import { LineEngine } from "../line/engine/lineEngine";

export class SRelation extends SSelectable implements Relation {
    declare type: typeof Relation.TYPE;
    start!: string;
    end?: string | Point;
    points!: Point[];
    segments!: SegmentLayout[];
    style!: RelationStyle;
    selected = false;
    path!: RelationPath | null;

    constructor() {
        super();
        this.cachedProperty("path", () => RelationPath.fromRelation(this));
    }

    get contextMenuPos(): Point {
        const path = this.path;
        if (path == null) {
            return Point.ORIGIN;
        } else {
            return path.end;
        }
    }
}

export type RelationPathSegment =
    | {
          y: number;
          dy: number;
          x?: undefined;
          dx?: undefined;
      }
    | {
          x: number;
          dx: number;
          y?: undefined;
          dy?: undefined;
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
        const startPoint = LineEngine.DEFAULT.projectPointOrthogonal(startProjectionPoint, startShape.outline).point;

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
            endPoint = LineEngine.DEFAULT.projectPointOrthogonal(endProjectionPoint, endShape.outline).point;
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
                    dy: point.y - startPoint.y
                },
                {
                    x: point.x,
                    dx: point.x - startPoint.x
                }
            ];
        } else {
            return [
                {
                    x: point.x,
                    dx: point.x - startPoint.x
                },
                {
                    y: point.y,
                    dy: point.y - startPoint.y
                }
            ];
        }
    }

    export function simplify(path: RelationPath): RelationPath {
        const segments: RelationPath["segments"] = [];
        const lastPoint = { x: path.start.x, y: path.start.y };
        for (const segment of path.segments) {
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
        if (segments.length == 0) {
            segments.push({ x: 0, dx: 0 });
        }
        return { start: path.start, end: path.end, segments };
    }
}
