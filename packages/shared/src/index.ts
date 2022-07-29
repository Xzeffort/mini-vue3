export const isObject = (value: any) => {
  return typeof value === 'object' && value !== null;
};

export const isFunction = (value: any) => {
  return typeof value === 'function';
};

export const isArray = Array.isArray;

export const assign = Object.assign;
