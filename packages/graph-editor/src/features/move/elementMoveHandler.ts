import { Point } from "sprotty-protocol";
import { Component } from "../../model/component";
import { Interface } from "../../model/interface";
import { MoveHandler } from "./moveHandler";
import { UpdateLayoutAction } from "./updateLayoutAction";
import { GraphLayout } from "../../gropiusModel";
import { Relation } from "../../model/relation";

export class ElementMoveHandler implements MoveHandler {
    private readonly elementLayouts: Record<string, Point> = {};
    private readonly fullyMovedRelationLayouts: Record<string, Point[]> = {};

    constructor(elements: (Interface | Component)[], fullyMovedRelations: Relation[]) {
        for (const element of elements) {
            this.elementLayouts[element.id] = {
                x: element.x,
                y: element.y
            };
        }
        for (const relation of fullyMovedRelations) {
            this.fullyMovedRelationLayouts[relation.id] = relation.points;
        }
    }

    generateAction(dx: number, dy: number, commited: boolean, event: MouseEvent): UpdateLayoutAction {
        let offsetX = dx;
        let offsetY = dy;
        if (event.shiftKey) {
            if (Math.abs(dx) > Math.abs(dy)) {
                offsetY = 0;
            } else {
                offsetX = 0;
            }
        }
        const partialLayout: GraphLayout = {};
        for (const [key, layout] of Object.entries(this.elementLayouts)) {
            partialLayout[key] = {
                pos: {
                    x: layout.x + offsetX,
                    y: layout.y + offsetY
                }
            };
        }
        for (const [key, points] of Object.entries(this.fullyMovedRelationLayouts)) {
            partialLayout[key] = {
                points: points.map(point => ({
                    x: point.x + offsetX,
                    y: point.y + offsetY
                }))
            };
        }
        return {
            kind: UpdateLayoutAction.KIND,
            partialLayout
        };
    }
}
