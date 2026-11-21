export const passwordRules = [
  {
    label: "Entre 8 y 128 caracteres",
    test: (s: string) => s.length >= 8 && s.length <= 128,
  },
  { label: "Una letra mayúscula", test: (s: string) => /\p{Lu}/u.test(s) },
  { label: "Una letra minúscula", test: (s: string) => /\p{Ll}/u.test(s) },
  { label: "Un número", test: (s: string) => /\p{Nd}/u.test(s) },
  {
    label: "Un símbolo: @, #, ! u otro",
    test: (s: string) => /[^\p{L}\p{N}\s]/u.test(s),
  },
];
export const validPassword = (s: string) =>
  passwordRules.every((r) => r.test(s));
export function generateTemporaryPassword() {
  const groups = [
    "ABCDEFGHJKLMNPQRSTUVWXYZ",
    "abcdefghijkmnpqrstuvwxyz",
    "23456789",
    "@#!%+-_",
  ];
  const pick = (chars: string) => {
    const n = new Uint32Array(1),
      limit = Math.floor(4294967296 / chars.length) * chars.length;
    do {
      crypto.getRandomValues(n);
    } while (n[0] >= limit);
    return chars[n[0] % chars.length];
  };
  const chars = groups.join("");
  const value = [
    ...groups.map(pick),
    ...Array.from({ length: 12 }, () => pick(chars)),
  ];
  for (let i = value.length - 1; i > 0; i--) {
    const j =
      Number(
        pick(
          Array.from({ length: i + 1 }, (_, n) =>
            String.fromCharCode(65 + n),
          ).join(""),
        ).charCodeAt(0),
      ) - 65;
    [value[i], value[j]] = [value[j], value[i]];
  }
  return value.join("");
}
