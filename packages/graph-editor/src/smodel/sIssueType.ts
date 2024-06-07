import { Selectable } from "sprotty-protocol";
import { IssueRelationHighlightable } from "../features/issueRelationHighlight/IssueRelationHighlightable";
import { IssueType } from "../model/issueType";
import { SElement } from "./sElement";

export class SIssueType extends SElement implements IssueType, IssueRelationHighlightable, Selectable {
    declare type: typeof IssueType.TYPE;
    iconPath!: string;
    isOpen!: boolean;
    highlighted = false;
    selected = false;
}
