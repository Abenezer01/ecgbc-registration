declare module "ethiopian-date" {
  export function toGregorian(
    year: number,
    month: number,
    day: number
  ): [number, number, number];

  export function toEthiopic(
    year: number,
    month: number,
    day: number
  ): { year: number; month: number; day: number };
}
