export * from './shapeFlags';

export const isObject = (value: any) => {
  return typeof value === 'object' && value !== null;
};

export const isFunction = (value: any) => {
  return typeof value === 'function';
};

export const isString = (value) => typeof value === 'string';

export const isArray = Array.isArray;

export const extend = Object.assign;

const onRE = /^on[^a-z]/; // 例如 onClick on之后首字母大写
export const isOn = (key: string) => onRE.test(key);
