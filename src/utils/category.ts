const cleanSpaces = (value: string) => value.trim().replace(/\s+/g, ' ');

export const toCategoryKey = (value: string) => cleanSpaces(value).toLocaleLowerCase();

export const toCategoryLabel = (value: string) =>
  cleanSpaces(value)
    .split(' ')
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLocaleLowerCase()}`)
    .join(' ');

