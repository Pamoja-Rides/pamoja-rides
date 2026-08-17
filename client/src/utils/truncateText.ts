export const truncateText = (str: string, len: number) =>
  str.length > len ? str.slice(0, len) + "..." : str;
