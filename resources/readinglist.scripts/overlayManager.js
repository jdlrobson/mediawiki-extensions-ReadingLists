/**
 * Render the current overlay
 *
 * @param {JQuery.Promise<Object>} componentPromise
 * @return {JQuery.Promise<Vue>}
 */
function showOverlay( componentPromise ) {
	document.body.classList.add( 'reading-list-show-overlay' );
	return componentPromise.then( ( overlay ) => {
		const Vue = require( 'vue' ).default || require( 'vue' );
		return new Vue( {
			el: '#reading-list-overlay-container > div',
			/**
			 * @param {Function} createElement
			 * @return {Vue.VNode}
			 */
			render: function ( createElement ) {
				return overlay ? createElement( overlay.Component, overlay.options ) :
					createElement( 'div' );
			}
		} );
	} );
}

function hideOverlay() {
	showOverlay( $.Deferred().resolve() );
	document.body.classList.remove( 'reading-list-show-overlay' );
}

module.exports = {
	showOverlay,
	hideOverlay
};
