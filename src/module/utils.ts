export function isFromESModule(target: any) {
    return target && target.__esModule;
}

export function getDefault(target: any) {
    if (isFromESModule(target)) {
        return target;
    } else {
        return target.default;
    }
}
