import { Point } from "sprotty-protocol";
import { LinearAnimatable } from "../features/animation/model";
import { Interface } from "../model/interface";
import { Shape } from "../shape/shape";
import { ShapeGenerator } from "../shape/shapeGenerator";
import { SIssueAffected } from "./sIssueAffected";
import { SComponent } from "./sComponent";
import { SLabel } from "./sLabel";

const interfaceAnimatedFields = new Set(SIssueAffected.defaultAnimatedFields);
const INTERFACE_SHAPE_SIZE = 40;

export class SInterface extends SIssueAffected implements Interface, LinearAnimatable {
    declare type: typeof Interface.TYPE;
    readonly animatedFields = interfaceAnimatedFields;
    override shape!: Shape;
    pos!: Point;
    override issueTypesCenterTopPos!: Point;

    constructor() {
        super();
        this.cachedProperty<Shape>("shape", () => {
            return ShapeGenerator.DEFAULT.generateForBounds(
                this.style.shape,
                {
                    width: INTERFACE_SHAPE_SIZE,
                    height: INTERFACE_SHAPE_SIZE,
                    x: this.pos.x - INTERFACE_SHAPE_SIZE / 2,
                    y: this.pos.y - INTERFACE_SHAPE_SIZE / 2
                },
                this.style
            );
        });
        this.cachedProperty<Point>("pos", () => {
            const parent = this.parent as SComponent;
            return {
                x: this.x + parent.x,
                y: this.y + parent.y
            };
        });
        this.cachedProperty<Point>("issueTypesCenterTopPos", () => {
            const nameLabel = this.children.find((child) => child instanceof SLabel) as SLabel;
            return {
                x: this.pos.x,
                y: this.pos.y + this.shape.bounds.height / 2 + 2 * 3 + nameLabel!.size.height
            };
        });
    }
}
