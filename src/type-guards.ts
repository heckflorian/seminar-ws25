type Dog = { kind: "dog"; bark: () => string };
type Cat = { kind: "cat"; meow: () => string };
type Goat = { kind: "goat"; iah: () => string };

type Animal = Dog | Cat | Goat;

/**
 * Typeguard function that narrows `shape` to `Triangle`
 */
function isCat(animal: Animal): animal is Cat {
    return animal.kind === "cat";
}

function makeNoise(animal: Animal): void {
    // console.log(animal.meow()); // Fehler, meow is not a part of Animal
    if (isCat(animal)) {
        console.log(animal.meow());
    }
    // console.log(animal.meow()); // Error, meow is not a part of Animal
}
