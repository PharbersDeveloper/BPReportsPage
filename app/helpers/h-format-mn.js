import { helper } from '@ember/component/helper';
import {isEmpty} from "@ember/utils";

export function hFormatMn(params/*, hash*/) {
  let number = typeof params === "object" ? params[0] : params,
  fixedNumber = params[1]


 if ( isEmpty( number ) ) {
  return number
 }

 if ( !isEmpty( fixedNumber ) && !isEmpty( number ) ) {
    return (number/1000000).toFixed(fixedNumber)
  }

  return (number/1000000).toFixed(1)
}

export default helper(hFormatMn);
