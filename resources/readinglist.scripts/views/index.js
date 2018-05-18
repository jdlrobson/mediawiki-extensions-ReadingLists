const ReadingListPage = require( './ReadingListPage.vue' );
const CollectionDialog = require( './CollectionDialog.vue' );
const CollectionEditorDialog = require( './CollectionEditorDialog.vue' );

/**
 *
 * @param {string} title of page for which we are managing collection membership.
 * @param {Function} getUrl for generating a url for the current user taking two arguments:
 *  id and name
 * @param {Function} asyncGetCollections that resolves to a list of collections
 * @param {Function} onExit
 * @param {Function} onCreate
 * @param {Function} onAdd
 * @param {Function} onRemove
 * @return {Object}
 */
function createMembersOverlay( title, getUrl, asyncGetCollections, onExit, onCreate, onAdd, onRemove ) {

	return {
		Component: CollectionDialog,
		options: {
			props: {
				asyncGetCollections,
				manageUrl: getUrl(),
				allowCreate: onCreate !== undefined,
				text: 'CollectionOverlay'
			},
			on: {
				create: () => {
					onCreate();
				},
				hide: () => {
					onExit();
				},
				/**
				 *
				 * @param {number} id of list
				 * @param {boolean} isMember of the list?
				 * @param {string} name of the list
				 * @param {Function} done to call when the title has been added to the list
				 */
				select: function ( id, isMember, name, done ) {
					const url = getUrl( id, name );
					const action = isMember ? onRemove( id, title ) : onAdd( id, title );
					const msg = isMember ?
						$( '<span>' ).html(
							mw.message( 'readinglists-browser-remove-entry-success', title, url, name ).parse()
						) :
						$( '<span>' ).html(
							mw.message( 'readinglists-browser-add-entry-success', title, url ).parse()
						);
					action.then( function () {
						mw.notify( msg );
						done();
					}, function ( /** @type {string} */ err ) {
						switch ( err ) {
							case 'readinglists-db-error-no-such-project':
								// this is an error with the setup.
								// log error with mw.errorLogger.logError ?
								break;
							default:
								// todo: user friendly message preferred
								mw.notify( err, { type: 'error' } );
						}
					} );
				}
			}
		}
	};
}

/**
 *
 * @param {string|null} id if an existing collection
 * @param {Function} hideOverlay
 * @param {Function} saveReadingList
 * @return {Function}
 */
function onSaveReadingList( id, hideOverlay, saveReadingList ) {
	/**
	 * @param {string} name
	 * @param {string} description
	 * @return {JQuery.Promise<any>}
	 */
	return function ( name, description ) {
		return saveReadingList( id, name, description ).then( function () {
			hideOverlay();
			mw.notify( id ? 'Successfully updated your collection.' : 'Successfully created your new collection.' );
			// TODO: In future signal redraw of view.
			location.reload();
		}, function () {
			hideOverlay();
			mw.notify( id ? 'Unable to update collection.' : 'Unable to create collection.' );
		} );
	};
}

/**
 * @param {Function} showOverlay
 * @param {Function} hideOverlay
 * @param {Function} saveReadingList
 * @return {Function}
 */
function createListOverlay( showOverlay, hideOverlay, saveReadingList ) {
	return function () {
		showOverlay(
			Promise.resolve( {
				Component: CollectionEditorDialog,
				options: {
					on: {
						hide: hideOverlay,
						save: onSaveReadingList( null, hideOverlay, saveReadingList )
					}
				}
			} )
		);
	};
}

/**
 * @param {string} id of reading list
 * @param {string} name of reading list
 * @param {string} description of reading list
 * @param {Function} showOverlay
 * @param {Function} hideOverlay
 * @param {Function} saveReadingList
 * @return {Function}
 */
function editListOverlay( id, name, description, showOverlay, hideOverlay, saveReadingList ) {
	return function () {
		showOverlay(
			Promise.resolve( {
				Component: CollectionEditorDialog,
				options: {
					on: {
						hide: hideOverlay,
						save: onSaveReadingList( id, hideOverlay, saveReadingList )
					},
					props: {
						initialTitle: name,
						initialDescription: description
					}
				}
			} )
		);
	};
}

module.exports = {
	ReadingListPage,
	createMembersOverlay,
	createListOverlay,
	editListOverlay
};
