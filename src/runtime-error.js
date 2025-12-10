// Typlose Funktionen kopiert aus typescript beispiel
export const makeFormData = (val) => {
    return { value: val };
};

export const upperCase = (data) => {
    const internalData = data;
    return { value: internalData.value.toUpperCase() };
};

export const validate = (data) => {
    const internalData = data;
    if (internalData.value.length > 3) {
        return { value: internalData.value };
    }
    return null;
};

export const process = (data) => {
    const internalData = data;
    // Mache etwas mit den Daten
    console.log("4th letter is: ", internalData.value.at(4));
    return { value: internalData.value };
};

const testData = makeFormData("Seminar WS 25");
const validated1 = validate(testData);
process(validated1)


const testData2 = makeFormData("abc");
process(testData2)
const validated2 = validate(testData2);
process(validated2);

