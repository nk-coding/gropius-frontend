import { Action, Point } from "sprotty-protocol";
import { RelationPath, RelationPathSegment } from "../../smodel/relationPath";
import { MoveHandler } from "./moveHandler";
import { LineEngine } from "../../line/engine/lineEngine";
import { RelationLayout, SegmentLayout } from "../../gropiusModel";
import { Line } from "../../line/model/line";
import { UpdateLayoutAction } from "./updateLayoutAction";
import { Math2D } from "../../line/math";
import { roundToPrecision } from "../../base/roundToPrecision";

type BaseSegment =
    | {
          x: number;
          y?: undefined;
      }
    | {
          y: number;
          x?: undefined;
      };

export class RelationMoveHandler implements MoveHandler {
    constructor(
        readonly relation: string,
        readonly path: RelationPath,
        readonly segment: number,
        readonly startLine: Line,
        readonly endLine: Line
    ) {}

    generateAction(dx: number, dy: number, commited: boolean, event: MouseEvent): Action {
        let replacedStartSegments = 0;
        let replacedEndSegments = 0;
        const movedSegment = this.path.segments[this.segment];
        // do we move a vertical segment
        const vertical = movedSegment.y != undefined;
        const segmentCount = this.path.segments.length;
        const startSegments: BaseSegment[] = [];
        let newStartPoint: Point | undefined = undefined;
        const endSegments: BaseSegment[] = [];
        let moveVector: Point;
        if (vertical) {
            moveVector = { x: dx, y: 0 };
        } else {
            moveVector = { x: 0, y: dy };
        }
        if (this.segment <= 1) {
            replacedStartSegments = this.segment + 1;
            const [segments, projectedPoint] = this.projectPointOnElement(
                Math2D.add(RelationPath.segmentEnd(movedSegment), moveVector),
                true,
                vertical ? SegmentLayout.HORIZONTAL_VERTICAL : SegmentLayout.VERTICAL_HORIZONTAL
            );
            startSegments.push(...segments);
            newStartPoint = projectedPoint;
        }
        if (this.segment >= segmentCount - 2) {
            replacedEndSegments = segmentCount - this.segment;
            endSegments.push(
                ...this.projectPointOnElement(
                    Math2D.add(movedSegment.start, moveVector),
                    false,
                    vertical ? SegmentLayout.HORIZONTAL_VERTICAL : SegmentLayout.VERTICAL_HORIZONTAL
                )[0]
            );
        }
        let newLayout: RelationLayout;
        if (replacedStartSegments > 0 && replacedEndSegments > 0) {
            newLayout = this.layoutFromPath(newStartPoint!, [...startSegments, ...endSegments]);
        } else if (replacedStartSegments > 0) {
            newLayout = this.layoutFromPath(newStartPoint!, [
                ...startSegments,
                ...this.path.segments.slice(replacedStartSegments)
            ]);
        } else if (replacedEndSegments > 0) {
            const segmentToModify = this.path.segments.at(-replacedEndSegments - 1)!;
            const modifiedSegment = {
                x: segmentToModify.x ? segmentToModify.x + moveVector.x : undefined,
                y: segmentToModify.y ? segmentToModify.y + moveVector.y : undefined
            } as BaseSegment;
            newLayout = this.layoutFromPath(this.path.start, [
                ...this.path.segments.slice(0, segmentCount - replacedEndSegments - 1),
                modifiedSegment,
                ...endSegments
            ]);
        } else {
            const segmentToModifiy = this.path.segments[this.segment - 1];
            const modifiedSegment = {
                x: segmentToModifiy.x ? segmentToModifiy.x + moveVector.x : undefined,
                y: segmentToModifiy.y ? segmentToModifiy.y + moveVector.y : undefined
            } as BaseSegment;
            newLayout = this.layoutFromPath(this.path.start, [
                ...this.path.segments.slice(0, this.segment - 1),
                modifiedSegment,
                ...this.path.segments.slice(this.segment)
            ]);
        }
        const action: UpdateLayoutAction = {
            kind: UpdateLayoutAction.KIND,
            partialLayout: {
                [this.relation]: newLayout
            }
        };
        return action;
    }

    private layoutFromPath(start: Point, path: BaseSegment[]): RelationLayout {
        const simplified = RelationPath.simplifyPath(start, path);
        if (simplified.length > 1) {
            const points: Point[] = [];
            let current = { x: start.x, y: start.y };
            for (let i = 0; i < simplified.length - 1; i++) {
                const segment = simplified[i];
                if (segment.x != undefined) {
                    current = { x: segment.x, y: current.y };
                } else {
                    current = { x: current.x, y: segment.y };
                }
                points.push(current);
            }
            return { points };
        } else {
            const res = {
                points: [
                    {
                        x: (start.x + (simplified[0].x ?? start.x)) / 2,
                        y: (start.y + (simplified[0].y ?? start.y)) / 2
                    }
                ]
            };
            return res;
        }
    }

    private projectPointOnElement(point: Point, start: boolean, layout: SegmentLayout): [BaseSegment[], Point] {
        const roundedPoint = { x: roundToPrecision(point.x), y: roundToPrecision(point.y) };
        const projection = LineEngine.DEFAULT.projectPointOrthogonalWithPrecision(
            roundedPoint,
            start ? this.startLine : this.endLine,
            layout
        );
        const projectedPoint = projection.point;
        const result: BaseSegment[] = [];
        if (projectedPoint.x == roundedPoint.x) {
            if (start) {
                result.push({ y: roundedPoint.y });
            } else {
                result.push({ y: projectedPoint.y });
            }
        } else if (projectedPoint.y == roundedPoint.y) {
            if (start) {
                result.push({ x: roundedPoint.x });
            } else {
                result.push({ x: projectedPoint.x });
            }
        } else {
            if (start) {
                if (layout == SegmentLayout.HORIZONTAL_VERTICAL) {
                    result.push({ x: roundedPoint.x }, { y: roundedPoint.y });
                } else {
                    result.push({ y: roundedPoint.y }, { x: roundedPoint.x });
                }
            } else {
                if (layout == SegmentLayout.VERTICAL_HORIZONTAL) {
                    result.push({ x: projectedPoint.x }, { y: projectedPoint.y });
                } else {
                    result.push({ y: projectedPoint.y }, { x: projectedPoint.x });
                }
            }
        }
        return [result, projectedPoint];
    }
}
