import { helper } from '@ember/component/helper';

export function hShowPicOss(params/*, hash*/) {
  let img = params[0],
		client = params[1].get( "ossClient" )

	if ( img ) {
		let url = client.signatureUrl( "ow-resources/" + img )

		// window.console.log( img )
		window.console.log( url )
		return url
	} else {
		return ""
	}
}

export default helper(hShowPicOss);
