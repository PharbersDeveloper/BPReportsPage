import { helper } from '@ember/component/helper';

export function indexRank(params/*, hash*/) {
    return Number(params[0]) + 1

}

export default helper(indexRank);
