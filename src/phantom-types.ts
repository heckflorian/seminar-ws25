type Unvalidated = { _type: "Unvalidated" };
type Validated = { _type: "Validated" };

type FormData<T, D = never> = { value: never } & T;

type MakeFormData = (a: string) => FormData<Unvalidated>;

type UpperCase = (a: FormData<Unvalidated>) => FormData<Unvalidated>;

type Validate = (a: FormData<Unvalidated>) => FormData<Validated> | null;

type Process = (a: FormData<Validated>) => FormData<Validated>;

export const makeFormData: MakeFormData = (val) => {
    return { value: val } as FormData<Unvalidated>;
};

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

type InternalUnvalidated = Unvalidated & {
    value: string;
};

type InternalValidated = Validated & {
    value: string;
};

export const process: Process = (data: FormData<Validated>) => {
    const internalData = data as InternalValidated;
    // Mache etwas mit den Daten
    return { value: internalData.value } as FormData<Validated>;
};

const initialData = makeFormData("test");
const validatedData = validate(initialData);

// process(validatedData); // Error! Type 'FormData<Validated, never> | null' is not assignable to type 'FormData<Validated, never>'

if (validatedData !== null) {
    // validate(validatedData); // Error! Type '"Validated"' is not assignable to Type '"Unvalidated"'
    upperCase(initialData);
    // upperCase(validatedData) // Error! Type '"Validated"' is not assignable to Type '"Unvalidated"'
    process(validatedData);
    // process(initialData); // Error! Type '"Unvalidated"' is not assignable to Type '"Validated"'
}
