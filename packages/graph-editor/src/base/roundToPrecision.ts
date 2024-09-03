export function roundToPrecision(value: number): number {
    return Math.round(value / 10) * 10;
}

export function floorToPrecision(value: number): number {
    return Math.floor(value / 10) * 10;
}

export function ceilToPrecision(value: number): number {
    return Math.ceil(value / 10) * 10;
}