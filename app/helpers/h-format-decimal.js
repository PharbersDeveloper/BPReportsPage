import { helper } from '@ember/component/helper';

export function hFormatDecimal(params/*, hash*/) {
  let number = params[0] || 0,
    fixed = params[1] || 2
  return Number(number.toFixed(fixed));
}

export default helper(hFormatDecimal);
