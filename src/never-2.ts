interface Triangle {
    kind: "triangle";
    sideLength: number;
}

type Shape2 = Circle | Square | Triangle;

const getArea2 = (shape: Shape2) => {
    switch (shape.kind) {
        case "circle":
            return Math.PI * shape.radius ** 2;
        case "square":
            return shape.sideLength ** 2;
        default: // nicht mehr alle fälle durch case blöcke abgedeckt
            const _exhaustiveCheck: never = shape;
            // Type 'Triangle' is not assignable to type 'never'.
            return _exhaustiveCheck;
    }
};
