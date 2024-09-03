import { injectable } from "inversify";
import { VNode } from "snabbdom";
import { IView, RenderingContext, svg } from "sprotty";
import { SRelation } from "../smodel/sRelation";
import { Math2D } from "../line/math";
import { StrokeStyle } from "../gropiusModel";
import { MarkerGenerator } from "../marker/markerGenerator";
import { SLabel } from "../smodel/sLabel";
import { Point } from "sprotty-protocol";

@injectable()
export class RelationView implements IView {
    render(model: Readonly<SRelation>, context: RenderingContext, args?: {} | undefined): VNode | undefined {
        const relationPath = model.path;
        if (relationPath == null) {
            return undefined;
        }
        const { start, end, segments } = relationPath;
        let lastSegment = segments.at(-1)!;
        let endVector = Math2D.scale({ x: lastSegment.dx ?? 0, y: lastSegment.dy ?? 0 }, -1);
        if (Math2D.length(endVector) == 0) {
            endVector = { x: 1, y: 0 };
        }
        const markerAngle = Math2D.angle(endVector) + Math.PI;
        const strokeWidth = StrokeStyle.strokeWidth(model.style);
        const pathStyle = {
            "stroke-width": strokeWidth,
            stroke: model.style.stroke?.color ?? "var(--shape-stroke-color)"
        };
        const markerInfo = MarkerGenerator.DEFAULT.getMarkerInfo(model.style);
        const markerStartPoint = Math2D.add(end, Math2D.scaleTo(endVector, markerInfo.startOffset));
        const children: (VNode | undefined)[] = [];
        const endMarker = svg("path", {
            attrs: {
                d: markerInfo.path,
                ...pathStyle,
                transform: `translate(${markerStartPoint.x}, ${markerStartPoint.y}) rotate(${
                    (markerAngle * 180) / Math.PI
                })`,
                fill: markerInfo.filled ? pathStyle.stroke : "none"
            }
        });
        children.push(endMarker);

        const endOffset = markerInfo.startOffset - markerInfo.lineOffset;
        const pathParts = [`M ${start.x} ${start.y}`];
        const currentPoint = { x: start.x, y: start.y };
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            let offset = 0;
            if (i == segments.length - 1) {
                offset = endOffset;
            }
            if (segment.x != undefined) {
                const x = segment.x + Math.sign(endVector.x) * offset;
                pathParts.push(`H ${x}`);
                //TODO add edit part
                currentPoint.x = x;
            } else {
                const y = segment.y + Math.sign(endVector.y) * offset;
                pathParts.push(`V ${y}`);
                //TODO add edit part
                currentPoint.y = y;
            }
            pathParts.push(`L ${currentPoint.x} ${currentPoint.y}`);
        }

        const pathPath = pathParts.join(" ");
        const pathAttributes: Record<string, string | number> = {
            d: pathPath,
            ...pathStyle,
            fill: "none"
        };
        if (model.style.stroke?.dash != undefined) {
            pathAttributes["stroke-dasharray"] = model.style.stroke.dash.join(" ");
        }
        const path = svg("path", {
            attrs: pathAttributes
        });
        children.push(path);
        const hiddenPath = svg("path", {
            attrs: {
                d: pathPath
            },
            class: {
                "hidden-path": true
            }
        });
        children.push(hiddenPath);
        if (model.selected) {
            const selectedPath = svg("path", {
                attrs: {
                    d: pathPath,
                    fill: "none"
                },
                class: {
                    "selected-path": true
                }
            });
            children.push(selectedPath);
        }

        for (const child of model.children) {
            if (child instanceof SLabel) {
                // TODO
            }
        }
        return svg(
            "g",
            {
                class: {
                    selectable: true
                }
            },
            ...children
        );
    }
}
