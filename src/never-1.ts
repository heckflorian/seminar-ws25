type Circle = { kind: "circle"; radius: number };
type Square = { kind: "square"; sideLength: number };

type Shape = Circle | Square;

const getArea = (shape: Shape) => {
    switch (shape.kind) {
        case "circle":
            return Math.PI * shape.radius ** 2;
        case "square":
            return shape.sideLength ** 2;
        default:
            const _exhaustiveCheck: never = shape;
            return _exhaustiveCheck;
        // Compiler erkennt, dass der default case nicht erreicht
        // werden kann und lässt den never return zu
    }
};
