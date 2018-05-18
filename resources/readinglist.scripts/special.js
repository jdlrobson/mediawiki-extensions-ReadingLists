const api = require( './api.js' );
const { showOverlay, hideOverlay } = require( './overlayManager.js' );

/**
 * Renders the special page.
 *
 * @param {Vue.VueConstructor} Vue
 * @param {string} username of current user
 * @param {number|null} initialCollection identifer
 * @return {Vue}
 */
function init( Vue, username, initialCollection ) {
	console.log('init sp');
	const {
		ReadingListPage, editListOverlay,
		createListOverlay } = require( 'readinglist.scripts.views' );
	return new Vue( {
		el: '#reading-list-container',
		/**
		 * @param {Function} createElement
		 * @return {Vue.VNode}
		 */
		render: function ( createElement ) {
			return createElement( ReadingListPage, {
				props: {
					username,
					api,
					initialCollection,
					getRecommendationsFromTitle: ( title ) => {
						return api.getLinksInPage( title );
					},
					getRecommendations: ( titles ) => {
						return api.getRecommendations( titles );
					}
				},
				on: {
					create: () => {
						createListOverlay( showOverlay, hideOverlay, api.saveReadingList )();
					},
					/**
					 * @param {number} id of list
					 */
					delete: ( id ) => {
						// eslint-disable-next-line no-alert
						const confirm = window.confirm( 'Are you sure you want to delete this list?' );
						if ( confirm ) {
							api.deleteCollection( id ).then(() => {
								window.location.reload();
							});
							
						}
					},
					/**
					 * @param {string} id of list
					 * @param {string} name of list
					 * @param {string} description of list
					 */
					edit: ( id, name, description ) => {
						editListOverlay( id, name, description, showOverlay, hideOverlay, api.saveReadingList )();
					},
					/**
					 * @param {string} id of list
					 * @param {string} name to add
					 */
					addToList: ( id, name ) => {
						api.addToList( id, name ).then(() => {
						}, () => {
							mw.notify( 'Error adding item to reading list', 'error' );
						} );
					}
				}
			} );
		}
	} );
}

module.exports = {
	init
};
