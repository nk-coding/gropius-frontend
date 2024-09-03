import { Action, Point } from "sprotty-protocol";
import { Component } from "../../model/component";
import { Interface } from "../../model/interface";
import { MoveHandler } from "./moveHandler";
import { UpdateLayoutAction } from "./updateLayoutAction";
import { GraphLayout } from "../../gropiusModel";

export class ElementMoveHandler implements MoveHandler {
    private readonly elementLayouts: Record<string, Point> = {};

    constructor(elements: (Interface | Component)[]) {
        for (const element of elements) {
            this.elementLayouts[element.id] = {
                x: element.x,
                y: element.y
            };
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
        return {
            kind: UpdateLayoutAction.KIND,
            partialLayout
        };
    }
}
