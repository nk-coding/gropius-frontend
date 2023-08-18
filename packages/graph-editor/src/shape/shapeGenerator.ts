import { ShapeEngine } from "./engines/shapeEngine";
import { Shape as GropiusShape, ShapeStyle } from "../gropiusModel";
import { Bounds } from "sprotty-protocol";
import { Shape } from "./shape";
import { EllipseEngine } from "./engines/ellipseEngine";
import { CircleEngine } from "./engines/circleEngine";

export class ShapeGenerator {
    static DEFAULT = new ShapeGenerator();

    private engines = new Map<GropiusShape, ShapeEngine>([
        ["circle", new CircleEngine()],
        ["ellipse", new EllipseEngine()]
    ]);

    generateForBounds(shape: GropiusShape, bounds: Bounds, style: ShapeStyle): Shape {
        const engine = this.getEngine(shape);
        return engine.generateForBounds(bounds, style);
    }

    generateForInnerBounds(shape: GropiusShape, bounds: Bounds, style: ShapeStyle): Shape {
        const engine = this.getEngine(shape);
        return engine.generateForInnerBounds(bounds, style);
    }

    private getEngine(shape: GropiusShape): ShapeEngine {
        const engine = this.engines.get(shape);
        if (engine) {
            return engine;
        } else {
            throw new Error(`No engine found for shape ${shape}`);
        }
    }
}