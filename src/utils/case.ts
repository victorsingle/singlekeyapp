// camelCase → snake_case
export const toSnake = (s: string) =>
    s.replace(/[A-Z]/g, l => '_' + l.toLowerCase());
  
  // mapeia todas as chaves do objeto
  export const keysToSnake = <T extends Record<string, any>>(obj: T) =>
    Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [toSnake(k), v])
    ) as Record<string, any>;
  
    // snake_case → camelCase
export const toCamel = (s: string) =>
    s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
  
  // mapeia todas as chaves do objeto
  export const keysToCamel = <T extends Record<string, any>>(obj: T) =>
    Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [toCamel(k), v])
    ) as Record<string, any>;