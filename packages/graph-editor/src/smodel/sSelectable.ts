import { SElement } from "./sElement";
import { SLabel } from "./sLabel";
import { Point } from "sprotty-protocol";
import { Selectable } from "../model/selectable";

export abstract class SSelectable extends SElement implements Selectable {
    nameLabel!: SLabel;
    abstract contextMenuPos: Point;
    contextMenuData: any;

    constructor() {
        super();
        this.cachedProperty<SLabel>("nameLabel", () => {
            return this.children.find((child) => child.type === "label") as SLabel;
        });
    }
}
