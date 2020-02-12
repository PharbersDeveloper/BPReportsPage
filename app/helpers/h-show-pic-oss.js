import { helper } from '@ember/component/helper';

export function hShowPicOss(params/*, hash*/) {
  let img = params[0],
		client = params[1].get( "ossClient" )

	if ( img ) {
		let url = client.signatureUrl( "ow-resources/" + img )

		return url
	} else {
		return ""
	}
}

export default helper(hShowPicOss);
