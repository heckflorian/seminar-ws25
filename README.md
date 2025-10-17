# Expressive Types

Dieses Repository ist meine Abgabe zum Seminar "Was du schon immer über Programmiersprachen wissen wolltest" im WS 2025/2026.

In diesem Repo möchte ich ein paar Verwendungen von expressiven Typen in TypeScript aufzeigen.

## Phantom Types und Verwendung[^1]

Phantom Types sind Typen, die eine generische komponente haben, die nicht auf der rechten seite der typ deklaration vorkommen

```typescript
type FormData<A> = string;
```

`FormData` ist ein Phantomtyp, da der `A` Parameter nur auf der linken Seite vorkommt.

Als nächstes wollen wir einem Bibliotheksbenutzer erlauben einen `FormData` Typ zu erstellen. Außerdem wollen wir den Typen in bestimmten Teilen der Bibliothek einschränken. Dafür machen wir zwei neue Typen

```ts
type Unvalidated = { _type: "Unvalidated" };
type Validated = { _type: "Validated" };
```

Als nächstes implementieren wir einen `FormData` Typen, der es dem Nutzer der Bibliothek verbietet, die `value` Typdefinition zu überschreiben. In diesem spezifischen Fall definieren wir `value` mit einem `never` Typ.

```ts
type FormData<T, D = never> = { value: never } & T;
```

## TypeScript `never` [^2][^3][^4]

"The **never** type represents the type of values that never occur. Variables also acquire the type **never** when narrowed by any type guards that can never be true."

Der `never` Typ ist quasi die leere Menge unter den typen. Der `never` typ ist ein subtyp jedes anderen typs, aber kein typ ist ein subtyp von, oder zuweisbar zum `never` Typ (außer `never` selbst) [^2]

`never` kann auch in function expressions oder arrow functions, wenn diese function keine return statements hat, oder nur return statements mit `never` als typen hat _und_ der endpunkt der Funktion nicht erreichbar ist (durch kontrollflussanalyse bestimmt) ist der abgeleitete return type `never`

Wenn eine Funktion return typ `never` hat, müssen alle return statements (falls vorhanden) ausdrücke vom typ `never` haben und der endpunkt der funktion darf nicht erreichbar sein

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
	sideLength: number;
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

Da wir nun diese Helfer Funktionen definiert haben, können wir nun daraus Funktionen implementieren, welche sicherstellen, dass nur
ein bestimmter Typ von Daten in den jeweiligen Daten verwendet wird.

```ts
export const makeFormData: MakeFormData = (val) => {
    return { value } as FormData<Unvalidated>;
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

[^1]: https://dev.to/busypeoples/notes-on-typescript-phantom-types-kg9
[^2]: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-0.html
[^3]: https://stackoverflow.com/questions/42291811/use-of-never-keyword-in-typescript
[^4]: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
