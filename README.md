# Expressive Types

Dieses Repository ist meine Abgabe zum Seminar "Was du schon immer über Programmiersprachen wissen wolltest" im WS 2025/2026.

In diesem Repo möchte ich ein paar Verwendungen von expressiven Typen in TypeScript aufzeigen.

## Motivation

Man stelle sich vor, man hat ein Webformular, welches Daten von Nutzern erhält, welche man nun verarbeiten möchte.

Hierbei können nun folgende Anwendungsfälle entstehen:
- Daten könnten direkt nach der Eingabe bearbeitet, bzw. überprüft, werden können
- Daten müssen validiert werden
- Validierte Daten könnten auf eine spezielle Art und Weise transformiert werden
- Validierte Daten müssen verarbeitet werden (und ausschließlich validierte Daten)

Jetzt könnte man seine Daten als String speichern (oder als Array aus Strings, JavaScript Objekt, usw...)
und dann Funktionen schreiben die jeweils das gewünschte erfüllen.

Damit wäre das gewünschte erfüllt und das Formular hat seine Funktionalität erhalten.

... was ist aber wenn ein etwas inkompetenter Entwickler sich nicht an die Vorgaben hält und unvalidierte Daten verarbeiten will?

Dieser Fehler fällt zunächst nicht auf (und es gibt _selbstverständlich_ auch keine Test Cases die genau diesen Fall abdecken)
und der Code geht in Produktion. Wenn Nutzer nun Daten in das Formular schreiben fliegt alles zur Run-Time um die Ohren und die 
Anwendung stürtzt eventuell sogar ab.

Hier wäre es also sehr schön, wenn dieser Fehler zur Compile-Time schon auffällt und deshalb gar nicht erst entstehen kann.
Dabei können Phantom Typen helfen, welche im folgenden anhand des Formularbeispiels erklärt werden.

Zum Abschluss werden noch zwei kleine, aber sehr nützliche 'Type Narrowing' Konstrukte in TypeScript gezeigt und erläutert.

# Phantom Typen und deren Verwendung [^1]

Phantom Typen sind Typen, die eine generische komponente haben, die nicht auf der rechten seite der typ deklaration vorkommen

```typescript
type FormData<A> = string;
```

`FormData` ist ein Phantomtyp, da der `A` Parameter nur auf der linken Seite vorkommt.

Als nächstes wollen wir einem Bibliotheksbenutzer erlauben einen `FormData` Typ zu erstellen. Außerdem wollen wir den Typen in 
bestimmten Teilen der Bibliothek einschränken. Dafür machen wir zwei neue Typen

Anmerken Laufzeit - Compilezeit

```ts
type Unvalidated = { _type: "Unvalidated" };
type Validated = { _type: "Validated" };
```

Als nächstes implementieren wir einen `FormData` Typen, der es dem Nutzer der Bibliothek verbietet, die `value` Typdefinition zu 
überschreiben. In diesem spezifischen Fall definieren wir `value` mit einem `never` Typ.

```ts
type FormData<T, D = never> = { value: never } & T;
```

## TypeScript `never` [^2] [^3] [^4]

"The **never** type represents the type of values that never occur. Variables also acquire the type **never** when narrowed by 
any type guards that can never be true."

Der `never` Typ ist quasi die leere Menge unter den typen. Der `never` typ ist ein subtyp jedes anderen typs, aber kein typ ist 
ein subtyp von, oder zuweisbar zum `never` Typ (außer `never` selbst) [^2]

`never` kann auch in function expressions oder arrow functions, wenn diese function keine return statements hat, oder nur return 
statements mit `never` als typen hat _und_ der endpunkt der Funktion nicht erreichbar ist (durch kontrollflussanalyse bestimmt) 
ist der abgeleitete return type `never`

Wenn eine Funktion return typ `never` hat, müssen alle return statements (falls vorhanden) ausdrücke vom typ `never` haben und 
der endpunkt der funktion darf nicht erreichbar sein

Beispiele `never`

```ts
// Funktion die never zurück gibt muss nicht erreichbaren endpunkt
// haben
function error(message: string): never {
    throw new Error(message);
}

// Abgeleiteter return typ ist never
function fail() {
    return error("Something failed");
}

// Funktion die never returned muss unerreichbaren endpunkt haben
function infiniteLoop(): never {
    while (true) {}
}
```

`never` kann auch verwendet werden um exhaustive type checking zu ermöglichen

```ts
type Circle = { kind: "circle"; radius: number };
type Square = { kind: "square"; sideLength: number };

type Shape = Circle | Square;

function getArea(shape: Shape) {
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
}
```

Wird jetzt der `Shape` typ aus dem beispiel erweitert ohne das switch statement anzupassen, wirft der TypeScript compiler Fehler

```ts
interface Triangle {
    kind: "triangle";
    height: number;
}

type Shape = Circle | Square | Triangle;

function getArea(shape: Shape) {
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
}
```

Als nächstes wollen wir eine Funktion exposen, die einen `string` erhält und unvalidierte `FormData` zurück gibt

```ts
type MakeFormData = (a: string) => FormData<Unvalidated>;
```

Vielleicht wollen wir noch eine `uppercase` Funktion die unvalidierte `FormData` nimmt und unvalidierte `FormData` zurück gibt

```ts
type UpperCase = (a: FormData<Unvalidated>) => FormData<Unvalidated>;
```

Dann brauchen wir noch eine `validate` Funktion die aus unvalidierter, validierte `FormData` macht:

```ts
type Validate = (a: FormData<Unvalidated>) => FormData<Validated> | null;
```

Zum schluss brauchen wir vielleicht noch eine `process` Funktion, welche unsere validierte `FormData` verarbeitet

```ts
type Process = (a: FormData<Validated>) => FormData<Validated>;
```

Da wir nun diese Helfer Funktionen definiert haben, können wir nun daraus Funktionen implementieren, welche sicherstellen, dass 
nur ein bestimmter Typ von Daten in den jeweiligen Daten verwendet wird.

```ts
export const makeFormData: MakeFormData = (val) => {
    return { value: val } as FormData<Unvalidated>;
};
```

Wenn wir uns die Typdefinition von `MakeFormData` anschauen, sehen wir, dass diese
Funktion einen String entgegen nimmt und unvalidierte `FormData` zurück gibt. Nutzer
der Bibliothek können `value` nicht definieren, da es als `never` Typ definiert ist. Sobald
dieser Typ erstellt wurde, können Nutzer den zurück gegebenen Wert validieren oder
kapitalisieren.

Nun schauen wir, wie wir die `upperCase` und `validate` Funktionen implementieren:

```ts
export const upperCase: UpperCase = (data) => {
    const internalData = data as InternalUnvalidated;
    return { value: internalData.value.toUpperCase() } as FormData<Unvalidated>;
};

export const validate: Validate = (data) => {
    const internalData = data as InternalUnvalidated;
    if (internalData.value.length > 3) {
        return { value: internalData.value } as FormaData<Validated>;
    }
    return null;
};
```

Wenn wir diese beiden Funktionen anschauen, fällt eine Sache auf. Wir müssen die enthaltenen
Daten casten. Aber was ist `InternalUnvalidated`?

```ts
type InternalUnvalidated = Unvalidated & {
    value: string;
};

type InternalValidated = Validated & {
    value: string;
};
```

Hier definieren wir eine interne Repräsentation unserer Daten, die von Nutzern der Bibliothek
versteckt wird. Wir geben hier an, das `value` ein `string` ist in diesem Fall.
`process` kann auf die selbe weise geschrieben werden, nur das wir auf `InternalValidated`
casten, da wir einen `FormData<Validated>` Typen erwarten.

```ts
export const process: Process = (data: FormData<Validated>) => {
    const internalData = data as InternalValidated;
    // Mache etwas mit den Daten
    return { value: internalData.value } as FormData<Validated>;
};
```

Dies können wir auch testen

```ts
const initialData = makeFormData("test");
const validatedData = validate(initialData);

// validate("hello") // Type '"hello"' is not assignable to type '{value: never}'
// validate({value: "hello"}) // Type 'string' is not assignable to type 'never'

if (validatedData !== null) {
    // validate(validatedData); // Error! Type '"Validated"' is not assignable to Type '"Unvalidated"'
    upperCase(initialData);
    // upperCase(validatedData) // Error! Type '"Validated"' is not assignable to Type '"Unvalidated"'
    process(validatedData);
    // process(initialData); // Error! Type '"Unvalidated"' is not assignable to Type '"Validated"'
}
```

# Type Narrowing

## Type Guard Funktionen [^5]

```ts
type Dog = { kind: "dog"; bark: () => string };
type Cat = { kind: "cat"; meow: () => string };
type Goat = { kind: "goat"; iah: () => string };

type Animal = Dog | Cat | Goat;

// 'Type Guard' Funktion
function isCat(animal: Animal): animal is Cat {
    return animal.kind === "cat";
}
```

Die Funktion `isCat` ist eine sogenannte "Type Guard" Funktion, sie returned einen "Type Predicate".
Wird diese in einem `if`-Block verwendet, wird das Objekt, das als Parameter
in diese Funktion übergeben wird, implizit auf den Guard-Typen gecastet.

Also folgendermaßen:

```ts
function makeNoise(animal: Animal): void {
    // console.log(animal.meow()); // Fehler, meow is not a part of Animal
    if (isCat(animal)) {
        console.log(animal.meow());
    }
    // console.log(animal.meow()); // Error, meow is not a part of Animal
}
```

Innerhalb des `if` Blocks ist `animal` implizit vom Typ `Cat`, außerhalb ist es vom Typ `Animal`.

Dies ist zum Beispiel von starkem Vorteil in einem for-loop über ein Array (oder ähnliches) aus Union Typen, Vererbungstypen 
(oder ähnlichem) um für Elemente von bestimmten Typen, bestimmte Methoden aufzurufen.

### Type Narrowing [^6]

Manchmal muss man nicht auf genau einen Typen casten, sondern es reicht sicherzustellen, dass ein bestimmtes Attribut oder eine
bestimmte Funktion vorhanden ist.

Dazu ein ähnliches Beispiel:

```ts
type Fish = { swim: () => void };
type Human = { walk: () => void, swim: () => void };
type Dog = { walk: () => void };
type Bird = { fly: () => void };

type Animal = Fish | Human | Dog | Bird;

const letWalk(animal: Animal): void {
    animal. ... // Typ hier 'Fish | Human | Dog | Bird', kein gemeinsames Attribut
    if ("walk" in animal) {
        animal.walk(); // korrekter Aufruf, Typ implizit hier 'Human | Dog', swim() kann nicht aufgerufen werden
    }
}
```

[^1]: https://dev.to/busypeoples/notes-on-typescript-phantom-types-kg9
[^2]: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-0.html
[^3]: https://stackoverflow.com/questions/42291811/use-of-never-keyword-in-typescript
[^4]: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#the-never-type
[^5]: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
[^6]: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#the-in-operator-narrowing
