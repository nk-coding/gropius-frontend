import { IssueOrderField } from "@/graphql/generated";

export const issueSortFields = {
    Updated: IssueOrderField.LastUpdatedAt,
    Created: IssueOrderField.CreatedAt,
    Title: IssueOrderField.Title,
    Priority: [IssueOrderField.PriorityValue, IssueOrderField.PriorityId],
    State: [IssueOrderField.StateIsOpen, IssueOrderField.StateName, IssueOrderField.StateId],
    Type: [IssueOrderField.TypeName, IssueOrderField.TypeId],
    Template: [IssueOrderField.TemplateName, IssueOrderField.TemplateId]
};
