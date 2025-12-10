# Zusammenfassung

## Phantom Types - Warum?

State ist ein wichtiger Grund für Objektorientierung.
State als Objektattribut zu speichern kann aber zu Fehlern zur Laufzeit führen wenn state checks nicht konsequent durchgeführt werden.

Es wäre also gut, wenn diese state checks vom Compiler gemacht werden könnten und damit solche Fehler zur compile time auftreten.

Hierfür können Phantom Types verwendet werden. In ihrer simpelsten Form sehen Phantom Typen so aus:
```ts
type Typ<Phantom> = string
```

Das Phantom ist hier die generische Komponente `Phantom` welches auf der rechten Seite der Definition nicht mehr vor kommt - damit also
keinen Einfluss auf den Typen hat als die Definition selbst.

Damit kann man dann zum Beispiel den state von so etwas wie Formular Daten modellieren, diese sind entweder validiert
oder unvalidiert, also in etwa so:

```ts
type FormularDaten<Unvalidiert> = string;
type FormularDaten<Validiert> = string;
```

Dadurch sind beide Typen effektiv string aber:

```ts
FormularDaten<Unvalidiert> === FormularDaten<Validiert> // = false
```
