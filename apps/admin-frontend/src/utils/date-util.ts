import { toEthiopian } from "ethiopian-date";
export function getCurrentEthYear(): number {
    const now = new Date();
  

   
  
    const gYear = now.getUTCFullYear();
    const gMonth = now.getUTCMonth() + 1; // JavaScript months are 0-indexed
    const gDay = now.getUTCDate();
  
    const [year] = toEthiopian(gYear, gMonth, gDay);
  
    return year
  }
  export function getEthipianYear(date:string): number {
    const gregorianDate = new Date(date);
    const gYear = gregorianDate.getUTCFullYear();
    const gMonth = gregorianDate.getUTCMonth() + 1; // JavaScript months are 0-indexed
    const gDay = gregorianDate.getUTCDate();
  
    const [year] = toEthiopian(gYear, gMonth, gDay);
  
    return year
  }
export function ethiopianDate (gregirianDate: string) {
  const date = new Date(gregirianDate)
  const gYear = date.getUTCFullYear();
  const gMonth = date.getUTCMonth() + 1; // JavaScript months are 0-indexed
  const gDay = date.getUTCDate();

  const [year, month, day] = toEthiopian(gYear, gMonth, gDay);
  return `${day}/${month}/${year}`
    
}