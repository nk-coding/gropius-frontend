import { injectable } from "inversify";
import { VNode } from "snabbdom";
import { IView, IViewArgs, RenderingContext, svg } from "sprotty";
import { SInterface } from "../smodel/sInterface";
import { SLabel } from "../smodel/sLabel";
import { LineEngine } from "../line/engine/lineEngine";
import { wrapForeignElement } from "./util";
import { SComponent } from "../smodel/sComponent";
import { Bounds } from "sprotty-protocol";
import { Math2D } from "../line/math";

const MAX_CONTROL_POINT_DISTANCE = 75;

@injectable()
export class InterfaceView implements IView {
    render(model: Readonly<SInterface>, context: RenderingContext, args?: {} | undefined): VNode | undefined {
        let nameLabel: SLabel | undefined;
        for (const child of model.children) {
            if (child instanceof SLabel) {
                nameLabel = child;
            }
        }
        const shape = model.shape;
        const parent = model.parent as SComponent;
        const connectionLine = this.renderConnectionLine(model, parent);
        const interfaceView = svg(
            "g",
            null,
            svg("path", {
                attrs: {
                    d: LineEngine.DEFAULT.toPathString(shape.outline, { x: 0, y: 0 }),
                    ...model.generateShapeAttrs()
                }
            }),
            wrapForeignElement(context.renderElement(nameLabel!), {
                x: model.pos.x - nameLabel!.size.width / 2,
                y: model.pos.y + model.shape.bounds.height / 2 + 5
            })
        );
        return svg("g", null, interfaceView, connectionLine);
    }

    private renderConnectionLine(model: Readonly<SInterface>, parent: SComponent): VNode {
        const shape = model.shape;
        const parentShape = parent.shape;
        const center = Bounds.center(shape.bounds);
        const parentCenter = Bounds.center(parentShape.bounds);
        const startPos = LineEngine.DEFAULT.projectPoint(parentCenter, shape.outline).pos;
        const endPos = LineEngine.DEFAULT.projectPoint(center, parentShape.outline).pos;
        const startPoint = LineEngine.DEFAULT.getPoint(startPos, 0, shape.outline);
        const endPoint = LineEngine.DEFAULT.getPoint(endPos, 0, parentShape.outline);
        const startVector = LineEngine.DEFAULT.getNormal(startPos, shape.outline);
        const endVector = LineEngine.DEFAULT.getNormal(endPos, parentShape.outline);
        const discance = Math2D.distance(startPoint, endPoint);
        const controlPointDistance = Math.min(discance / 2, MAX_CONTROL_POINT_DISTANCE);
        const controlPoint1 = Math2D.add(startPoint, Math2D.scaleTo(startVector, controlPointDistance));
        const controlPoint2 = Math2D.add(endPoint, Math2D.scaleTo(endVector, controlPointDistance));
        return svg("path", {
            attrs: {
                d: `M ${startPoint.x} ${startPoint.y} C ${controlPoint1.x} ${controlPoint1.y} ${controlPoint2.x} ${controlPoint2.y} ${endPoint.x} ${endPoint.y}`,
                stroke: "var(--shape-stroke-color)",
                fill: "none",
                "stroke-width": 2
            }
        });
    }
}
