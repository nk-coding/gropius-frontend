import { DefaultAffectedByIssueInfoFragment } from "@/graphql/generated";

export function affectedByIssueName(entity: DefaultAffectedByIssueInfoFragment): string {
    switch (entity.__typename) {
        case "Component":
            return entity.name;
        case "Project":
            return entity.name;
        case "ComponentVersion":
            return `${entity.component.name} (v${entity.version})`;
        case "InterfaceSpecification":
            return entity.name;
        case "InterfaceSpecificationVersion":
            return `${entity.interfaceSpecification.name} (v${entity.version})`;
        case "Interface": {
            const version = entity.interfaceDefinition.interfaceSpecificationVersion;
            return `${version.interfaceSpecification.name} (v${version.version})`;
        }
        case "InterfacePart":
            return entity.name;
    }
}

export function affectedByIssueDescription(entity: DefaultAffectedByIssueInfoFragment): string {
    switch (entity.__typename) {
        case "Component":
            return entity.description;
        case "Project":
            return entity.description;
        case "ComponentVersion":
            return entity.component.description;
        case "InterfaceSpecification":
            return entity.description;
        case "InterfaceSpecificationVersion":
            return entity.interfaceSpecification.description;
        case "Interface":
            return entity.interfaceDefinition.interfaceSpecificationVersion.interfaceSpecification.description;
        case "InterfacePart":
            return entity.description;
    }
}

export function affectedByIssueIcon(type: DefaultAffectedByIssueInfoFragment["__typename"]): string {
    switch (type) {
        case "Component":
            return "$component";
        case "Project":
            return "$project";
        case "ComponentVersion":
            return "$component-version";
        case "Interface":
            return "$interface";
        case "InterfaceSpecification":
            return "$interface-specification";
        case "InterfaceSpecificationVersion":
            return "$interface-specification-version";
        case "InterfacePart":
            return "$interface-part";
        default:
            throw new Error(`Unknown affectedByIssue type: ${type}`);
    }
}
