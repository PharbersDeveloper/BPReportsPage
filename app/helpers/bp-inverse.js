import { helper } from '@ember/component/helper';

export function bpInverse(params/*, hash*/) {
  let t = params[0]
  return !t;
}

export default helper(bpInverse);
