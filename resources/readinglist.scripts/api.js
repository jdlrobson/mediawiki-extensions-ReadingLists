const { DEFAULT_READING_LIST_NAME,
	DEFAULT_READING_LIST_DESCRIPTION } = require( './consts.js' );
const { getReadingListUrl } = require( './utils.js' );

const api = new mw.Api();
const API_READ_URL = 'https://en.wikipedia.org/w/api.php';

/**
 * @typedef ApiQueryResponseReadingListEntry
 * @property {string} title
 */

/**
 * @typedef ApiQueryResponseReadingListEntryItem
 * @property {string} title
 * @property {number} id
 */

/**
 * @typedef ApiQueryResponseReadingListItem
 * @property {number} id
 * @property {string} name
 * @property {string} description
 * @property {boolean} default whether it is the default
 */

/**
 * @typedef ApiQueryResponsePage
 * @property {string} title
 */

/**
 * @typedef ApiQueryResponseReadingListsQuery
 * @property {ApiQueryResponseReadingListItem[]} readinglists
 */

/**
 * @typedef ApiQueryResponseReadingListQuery
 * @property {ApiQueryResponseReadingListEntryItem[]} readinglistentries
 */

/**
 * @typedef  ApiQueryResponseTitlesQuery
 * @property {ApiQueryResponsePage[]} pages
 */

/**
 * @typedef ApiQueryResponseReadingListEntries
 * @property {ApiQueryResponseReadingListQuery} query
 */

/**
 * @typedef ApiQueryError
 * @property {number} code
 */

/**
 * @typedef ApiQueryResponseReadingLists
 * @property {ApiQueryResponseReadingListsQuery} query
 * @property {ApiQueryError} [error]
 */

/**
 * @typedef ApiQueryResponseTitles
 * @property {ApiQueryResponseTitlesQuery} query
 */

/**
 * @typedef Card
 * @property {number} [id]
 * @property {string} url
 * @property {string} [ownerName]
 * @property {string} title
 * @property {string} [description]
 * @property {boolean} [isMember]
 */

/**
 * Converts API response to WVUI compatible response.
 *
 * @param {ApiQueryResponseReadingListItem} collection from API response
 * @param {string} ownerName of collection
 * @param {number[]} marked list of collections which should be identified as containing
 *  the current title.
 * @return {Card} modified collection
 */
const readingListToCard = ( collection, ownerName, marked ) => {
	const description = collection.default ?
		DEFAULT_READING_LIST_DESCRIPTION : collection.description;
	const title = collection.default ? DEFAULT_READING_LIST_NAME : collection.name;
	const isMember = ( marked || [] ).indexOf( collection.id ) > -1;
	const url = getReadingListUrl( ownerName, collection.id, title );
	return Object.assign( {}, collection, { ownerName, title, description, url, isMember } );
};

/**
 * @param {ApiQueryResponsePage} page
 * @return {Card}
 */
const pageToCard = ( page ) => {
	return Object.assign( page, {
		url: new mw.Title( page.title ).getUrl(),
		thumbnail: page.thumbnail ? {
			mimetype: 'image/jpeg',
			width: 200,
			height: 150,
			url: page.thumbnail.source
		} : null
	} );
};

/**
 * @param {string|null} id if an existing collection
 * @param {string} name of list
 * @param {string} description of list
 * @return {JQuery.Promise<any>}
 */
function saveReadingList( id, name, description ) {
	if ( id ) {
		return api.postWithToken( 'csrf', {
			action: 'readinglists',
			list: id,
			name: name,
			description: description,
			command: 'update'
		} );
	} else {
		return api.postWithToken( 'csrf', {
			action: 'readinglists',
			name: name,
			description: description,
			command: 'create'
		} );
	}
}

/**
 *
 * @param {number} id of list
 * @return {JQuery.Promise<any>}
 */
function deleteCollection( id ) {
	return api.postWithToken( 'csrf', {
		action: 'readinglists',
		list: id,
		command: 'delete'
	} );
}

/**
 *
 * @return {string}
 */
function getCurrentProjectName() {
	// Use wgServer to avoid issues with ".m." domain
	const server = mw.config.get( 'wgServer' );
	return server.indexOf( '//' ) === 0 ?
		window.location.protocol + server : server;
}

/**
 * @param {number} id
 * @param {string} title
 * @return {JQuery.Promise<any>}
 */
function addToList( id, title ) {
	return api.postWithToken( 'csrf', {
		action: 'readinglists',
		list: id,
		project: getCurrentProjectName(),
		title: title,
		command: 'createentry'
	} );
}

/**
 * @param {number} id of list
 * @param {string} title of page
 * @return {JQuery.Promise<ApiQueryResponseReadingListEntryItem>}
 */
function findItemInList( id, title ) {
	return api.get( { action: 'query', format: 'json',
		list: 'readinglistentries',
		rlelists: id
	} ).then( function ( data ) {
		const items = data.query.readinglistentries.filter(
			( /** @type {ApiQueryResponseReadingListEntryItem} */ item ) => item.title === title
		);
		if ( items.length === 0 ) {
			throw new Error( 'findItemInList doesn\'t know how to deal with pagination yet.' );
		} else {
			return items[ 0 ];
		}
	} );
}

// Note the remove from list function currently doesn't work.
// See https://phabricator.wikimedia.org/T198990
/**
 * @param {number} id
 * @param {string} title
 * @return {JQuery.Promise<any>}
 */
function removeFromList( id, title ) {
	return findItemInList( id, title ).then( function ( entry ) {
		return api.postWithToken( 'csrf', {
			action: 'readinglists',
			entry: entry.id,
			command: 'deleteentry'
		} );
	} );
}

/**
 * 
 * @return {JQuery.Promise<any>}
 */
function setupCollections() {
	return api.postWithToken( 'csrf', {
		action: 'readinglists',
		command: 'setup'
	} )
}

/**
 *
 * @param {string} ownerName (username)
 * @param {number[]} marked a list of collection IDs which have a certain title
 * @return {Promise<Card[]>}
 */
function getCollections( ownerName, marked ) {
	return new Promise( ( resolve, reject ) => {
		api.get( {
			action: 'query',
			format: 'json',
			rldir: 'descending',
			rlsort: 'updated',
			meta: 'readinglists',
			formatversion: 2
		} ).then( function ( /** @type {ApiQueryResponseReadingLists} */ data ) {
			resolve(
				( data.query.readinglists || [] ).map( ( collection ) =>
					readingListToCard( collection, ownerName, marked ) )
			);
		}, function ( /** @type {string} */ err ) {
			// setup a reading list and try again.
			if ( err === 'readinglists-db-error-not-set-up' ) {
					setupCollections().then( () => getCollections( ownerName, marked ) )
						.then( ( /** @type {Card[]} */ collections ) => resolve( collections ) );
			} else {
				reject( err );
			}
		} );
	} );
}

/**
 * Return the collections belonging to ownerName collections but with isMember key.
 *
 * @param {string} ownerName
 * @param {string} title to check for existence in those collections
 * @return {Function}
 */
function getCollectionsWithMembership( ownerName, title ) {
	return function () {
		// make sure it's an array
		return api.get( {
			action: 'query',
			format: 'json',
			meta: 'readinglists',
			rldir: 'descending',
			rlsort: 'updated',
			rlproject: getCurrentProjectName(),
			rltitle: title,
			formatversion: 2
		} ).then( function ( /** @type {ApiQueryResponseReadingLists} */data ) {
			const marked = data.query.readinglists.map(
				( collection ) => collection.id
			);
			return getCollections( ownerName, marked );
		}, function (/** @type {string} */ err ) {
			if ( err === 'readinglists-db-error-not-set-up' ) {
				return setupCollections().then(
					() => getCollectionsWithMembership( ownerName, title )
				)
			} else {
				throw new Error( 'Unexpected code path: '  + err );
			}
		} );
	};
}

/**
 * Gets pages on a given reading list
 *
 * @param {string} ownerName
 * @param {number} id of collection
 * @return {JQuery.Promise<Card>}
 */
function getCollectionMeta( ownerName, id ) {
	// Blocked by https://phabricator.wikimedia.org/T195019 - need to look up meta data here in a better way.
	return api.get( { action: 'query', format: 'json', meta: 'readinglists', rllist: id, formatversion: 2 } )
		.then( function ( /** @type {ApiQueryResponseReadingLists} */ data ) {
			if ( data.error && data.error.code ) {
				throw new Error( `Error: ${data.error.code}` );
			}
			return readingListToCard(
				data.query.readinglists[ 0 ],
				ownerName,
				[]
			);
		} );
}

/**
 * Gets pages on a given reading list
 *
 * @param {number} collectionId
 * @return {JQuery.Promise<any>}
 */
function getPages( collectionId ) {
	return api.get( {
		action: 'query',
		format: 'json',
		formatversion: 2,
		list: 'readinglistentries',
		rlelists: collectionId
	} ).then( ( /** @type {ApiQueryResponseReadingListEntries} */data ) => {
		// TODO: Limit list to 50
		const readinglistpages = data.query.readinglistentries;
		const titles = readinglistpages.map(
			( /** @type {ApiQueryResponseReadingListEntry} */ entry ) => entry.title
		);
		return titles.length ? api.get( {
			action: 'query',
			format: 'json',
			formatversion: 2,
			prop: 'pageimages|description',
			titles: titles,
			piprop: 'thumbnail',
			pithumbsize: 200
		} ).then( function ( /** @type {ApiQueryResponseTitles} */ pageData ) {
			const pages = pageData.query.pages;
			// make sure project is passed down.
			return pages.map( ( page, /** @type {number} */ i ) =>
				Object.assign( readinglistpages[ i ], pageToCard( page ) ) );
		} ) : [];
	} );
}

function getRecommendations( titles ) {
	// ... todo
	const parameters = /** @type {MwApiActionQuery} */ ( {
		action: 'query',
		formatversion: 2,
		origin: '*',
		prop: 'pageimages',
		piprop: 'thumbnail',
		pithumbsize: 160 // FIXME: Revert to 80 once pithumbmode is implemented
	} );
	parameters.prop += '|pageprops';
	parameters.ppprop = 'description';

	parameters.pilimit = 50;
	parameters.generator = 'search';
	parameters.gsrsearch = 'morelike:' + titles.join('|');
	parameters.gsrnamespace = '0';
	parameters.gsrlimit = 50;
	parameters.gsrqiprofile = 'classic_noboostlinks';

	// Currently, if you're logged in, then the API uses your language by default ard so responses
	// are always private i.e. they shouldn't be cached in a shared cache and can be cached by the
	// browser.
	//
	// By make the API use the language of the content rather than that of the user, the API
	// reponse is made public, i.e. they can be cached in a shared cache.
	//
	// See T97096 for more detail and discussion.
	parameters.uselang = 'content';

	// Instruct shared caches that the response will become stale in 24 hours.
	parameters.smaxage = 86400;

	// Instruct the browser that the response will become stale in 24 hours.
	parameters.maxage = 86400;

	return api.get( parameters, {
		url: API_READ_URL
	} ).then(( result ) => result.query ? result.query.pages.map( pageToCard ) : []);
}

function getLinksInPage( title ) {
	return api.get( {
		action: 'query',
		format: 'json',
		formatversion: 2,
		origin: '*',
		prop: 'pageimages|description|links',
		titles: title,
		pllimit: 500,
		pldir: Math.random() < 0.5 ? 'descending' : 'ascending',
		plnamespace: 0,
		piprop: 'thumbnail',
		pithumbsize: 200
	}, {
		url: API_READ_URL
	} ).then(( result ) => {
		const page = result.query && result.query.pages[0];
		return page ? page.links.map( pageToCard ).sort(() => Math.random() < 0.5 ? -1 : 1).slice(0, 10) : [];
	} );
}

module.exports = {
	getLinksInPage,
	getRecommendations,
	getPages,
	getCollectionMeta,
	getCollections,
	removeFromList,
	findItemInList,
	addToList,
	deleteCollection,
	saveReadingList,
	getCollectionsWithMembership
};
