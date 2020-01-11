import { helper } from '@ember/component/helper';
import {isEmpty} from "@ember/utils";

export function hFormatPercentage(params/*, hash*/) {
  let number = params[0] || 0,
  fixed = params[1] || 2

  if (isEmpty(number)) {
		return '';
	}
	let str = Number(number * 100).toFixed(fixed);

	if (Number(number) === 0) {
		return 0;
	}

	return `${str}%`;
}

export default helper(hFormatPercentage);
