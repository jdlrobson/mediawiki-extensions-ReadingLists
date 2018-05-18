const { getCollectionsWithMembership, saveReadingList, addToList, removeFromList } = require( './api.js' );
const { showOverlay, hideOverlay } = require( './overlayManager.js' );
const { getReadingListUrl } = require( './utils.js' );
const { WATCHSTAR_SELECTOR, BOOKMARK_ICON_CLASS } = require( './consts.js' );
const special = require( './special.js' );

/**
 * Inserts a link into the personal menu dropdown
 *
 * @param {string} ownerName (current user)
 */
function enableAsGadget( ownerName ) {
	const href = getReadingListUrl( ownerName );
	const text = 'Reading List';
	let portletId = 'p-personal';
	let nextNode = '#pt-logout';

	// vector
	if ( $( '.toggle-list-item' ).length ) {
		nextNode = '.toggle-list-item:last-child';
	}
	mw.util.addPortletLink( portletId, href, text, 'rl-bookmarkOutline',
		null, null, nextNode )
}

/**
 *
 * @param {string} title of the current page.
 * @param {string} user
 */
function hijackWatchstar( title, user ) {
	const id = $( '#page-actions' ).length ? 'page-actions' : 'p-views';
	const watchNode = $( WATCHSTAR_SELECTOR ).get( 0 );
	const nextNode = watchNode ? `${watchNode.getAttribute( 'id' )}` : null;
	const node = mw.util.addPortletLink( id, '#', 'Bookmark', 'rl-bookmarkOutline',
		null, null, nextNode );
	if ( !node ) {
		return;
	}
	$( '#ca-watchstar-sticky-header' ).removeClass(
		'mw-ui-icon-wikimedia-unStar'
	).on('click', (ev) => {
		ev.preventDefault();
	});
	// hooks are async.
	setTimeout( () => {
		const icon = node.querySelector( '.mw-ui-icon' );
		if ( icon ) {
			icon.classList.add( BOOKMARK_ICON_CLASS );
		}
	}, 1000 );
	$( node ).on( 'click', function () {
		showOverlay(
			mw.loader.using( 'readinglist.scripts.views' ).then(() => {
				const { createListOverlay, createMembersOverlay, saveReadingList } = require( 'readinglist.scripts.views' );
				return createMembersOverlay(
					title,
					( /** @type {number} */ id, /** @type {string} */ name ) =>
						getReadingListUrl( mw.user.getName(), id, name ),
					getCollectionsWithMembership( user, title ),
					hideOverlay,
					function () {
						hideOverlay();
						createListOverlay( showOverlay, hideOverlay, saveReadingList )();
					},
					addToList, removeFromList
				)
			} )
		);
		return false;
	} );
}

$( function () {
	const title = mw.config.get( 'wgTitle' ),
		params = title.split( '/' ).slice( 1 ),
		ownerName = params[ 0 ],
		collectionID = params.length > 1 ?
			parseInt( params[ 1 ], 10 ) : null;

	hijackWatchstar( title, ownerName );
	// Allow overlays
	$( '<div id="reading-list-overlay-container">' )
		.append( document.createElement( 'div' ) )
		.appendTo( document.body );
	$( '.mw-watchlink a, #ca-watch' ).off( 'click' );
	enableAsGadget( ownerName );
	if ( mw.config.get( 'wgNamespaceNumber' ) === -1 && title.split( '/' )[ 0 ] === 'ReadingLists' ) {
		// page doesn't exist
		if ( mw.config.get( 'wgArticleId' ) === 0 ) {
			const container = document.getElementById( 'reading-list-container' );
			const node = document.getElementById( 'mw-content-text' );
			if ( node && !container ) {
				node.innerHTML = '<div id="reading-list-container"></div>';
			} else {
				// eslint-disable-next-line no-console
				console.log( 'This check can now be removed.' );
			}
		}

		if ( params.length === 0 ) {
			window.location.pathname = getReadingListUrl( mw.user.getName() );
		} else {
			mw.loader.using( 'readinglist.scripts.views' ).then(() => {
				const Vue = require( 'vue' ).default || require( 'vue' );
				special.init( Vue, ownerName, collectionID );
			});
		}
	}
} );
