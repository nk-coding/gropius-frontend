import { Action, Point } from "sprotty-protocol";
import { RelationPath, RelationPathSegment } from "../../smodel/relationPath";
import { MoveHandler } from "./moveHandler";
import { LineEngine } from "../../line/engine/lineEngine";
import { RelationLayout, SegmentLayout } from "../../gropiusModel";
import { Line } from "../../line/model/line";
import { UpdateLayoutAction } from "./updateLayoutAction";
import { Math2D } from "../../line/math";

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
        const vertical = movedSegment.x != undefined;
        const segmentCount = this.path.segments.length;
        const startSegments: BaseSegment[] = [];
        let newStartPoint: Point | undefined = undefined;
        const endSegments: BaseSegment[] = [];
        let moveVector: Point;
        if (vertical) {
            moveVector = { x: 0, y: dy };
        } else {
            moveVector = { x: dx, y: 0 };
        }
        if (this.segment == 0) {
            replacedStartSegments = 1;
            const [segments, projectedPoint] = this.projectPointOnElement(
                Math2D.add(RelationPath.segmentEnd(movedSegment), moveVector),
                true,
                this.verticalToLayout(!vertical)
            );
            startSegments.push(...segments);
            newStartPoint = projectedPoint;
        }
        if (this.segment == 1) {
            replacedStartSegments = 2;
            const [segments, projectedPoint] = this.projectPointOnElement(
                Math2D.add(RelationPath.segmentEnd(movedSegment), moveVector),
                true,
                this.verticalToLayout(vertical)
            );
            startSegments.push(...segments);
            newStartPoint = projectedPoint;
        }
        if (this.segment == segmentCount - 1) {
            replacedEndSegments = 1;
            endSegments.push(
                ...this.projectPointOnElement(
                    Math2D.add(movedSegment.start, moveVector),
                    false,
                    this.verticalToLayout(!vertical)
                )[0]
            );
        }
        if (this.segment == segmentCount - 2) {
            replacedEndSegments = 2;
            endSegments.push(
                ...this.projectPointOnElement(
                    Math2D.add(movedSegment.start, moveVector),
                    false,
                    this.verticalToLayout(vertical)
                )[0]
            );
        }
        let newLayout: RelationLayout;
        if (replacedStartSegments > 0 && replacedEndSegments > 0) {
            newLayout = this.calculateNewLayout(newStartPoint!, startSegments, endSegments);
        } else if (replacedStartSegments > 0) {
            newLayout = undefined as any;
        } else if (replacedEndSegments > 0) {
            newLayout = undefined as any;
        } else {
            newLayout = undefined as any;
        }
        const action: UpdateLayoutAction = {
            kind: UpdateLayoutAction.KIND,
            partialLayout: {
                [this.relation]: newLayout
            }
        };
        return action;
    }

    private calculateNewLayout(start: Point, startSegments: BaseSegment[], endSegments: BaseSegment[]): RelationLayout {
        return this.layoutFromPath(start, [...startSegments, ...endSegments]);
    }

    private layoutFromPath(start: Point, path: BaseSegment[]): RelationLayout {
        const simplified = RelationPath.simplifyPath(start, path);
        if (simplified.length > 1) {
            const points: Point[] = [];
            const layout: SegmentLayout[] = [SegmentLayout.HORIZONTAL_VERTICAL];
            let current = { x: start.x, y: start.y };
            for (let i = 0; i < simplified.length - 1; i++) {
                const segment = simplified[i];
                if (segment.x != undefined) {
                    current = { x: segment.x, y: current.y };
                } else {
                    current = { x: current.x, y: segment.y };
                }
                points.push(current);
                layout.push(SegmentLayout.HORIZONTAL_VERTICAL);
            }
            return { points, segments: layout };
        } else {
            return {
                points: [{ x: (start.x + (simplified[0].x ?? start.x)) / 2, y: (start.y + (simplified[0].y ?? start.y)) / 2 }],
                segments: [SegmentLayout.HORIZONTAL_VERTICAL, SegmentLayout.HORIZONTAL_VERTICAL]
            };
        }
    }

    private projectPointOnElement(point: Point, start: boolean, layout: SegmentLayout): [BaseSegment[], Point] {
        const projection = LineEngine.DEFAULT.projectPointOrthogonalWithPrecision(
            point,
            start ? this.startLine : this.endLine,
            layout
        );
        const projectedPoint = projection.point;
        const result: BaseSegment[] = [];
        if (projectedPoint.x == point.x) {
            if (start) {
                result.push({ y: point.y });
            } else {
                result.push({ y: projectedPoint.y });
            }
        } else if (projectedPoint.y == point.y) {
            if (start) {
                result.push({ x: point.x });
            } else {
                result.push({ x: projectedPoint.x });
            }
        } else {
            if (start) {
                if (layout == SegmentLayout.HORIZONTAL_VERTICAL) {
                    result.push({ y: point.y }, { x: point.x });
                } else {
                    result.push({ x: point.x }, { y: point.y });
                }
            } else {
                if (layout == SegmentLayout.HORIZONTAL_VERTICAL) {
                    result.push({ x: projectedPoint.x }, { y: projectedPoint.y });
                } else {
                    result.push({ y: projectedPoint.y }, { x: projectedPoint.x });
                }
            }
        }
        return [result, projectedPoint];
    }

    private verticalToLayout(vertical: boolean): SegmentLayout {
        if (vertical) {
            return SegmentLayout.VERTICAL_HORIZONTAL;
        } else {
            return SegmentLayout.HORIZONTAL_VERTICAL;
        }
    }
}
