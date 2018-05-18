<template>
	<div class="readinglist-collection">
		<div class="readinglist-collection-summary">
			<h1>{{ viewTitle }}</h1>
			<p>&nbsp;{{ viewDescription }} </p>
			<wvui-button v-if="collection"
				action="progressive"
				type="primary"
				:disabled="isNotEditable"
				@click="editList">
				Edit this list
			</wvui-button>
			<wvui-button v-else
				type="primary"
				action="progressive"
				@click="createList">
				Create a list
			</wvui-button>
		</div>
		<div class="mw-rw-header">
			<ul class="mw-rl-list-links">
				<li>
					<a :href="getHomeUrl"
						@click.prevent="navigateHome">All lists</a>
				</li>
				<li v-if="name">
					<strong>{{ name }}</strong>
				</li>
			</ul>
		</div>
		<div v-if="errorCode">
			<error-box>{{ errorMessage }}</error-box>
		</div>
		<div v-if="loaded && !errorCode">
			<div class="readinglist-list">
				<ul v-if="cards.length">
					<li v-for="(suggestion,i) in cards" :key="i">
						<wvui-typeahead-suggestion
							:suggestion="suggestion"
							:url-generator="generator"
							:show-description="true"
							query=""
							:show-thumbnail="true"
							@click="clickCard"
						>
						</wvui-typeahead-suggestion>
					</li>
				</ul>
				<p v-else>
					{{ emptyMessage }}
				</p>
				<div class="readinglist-recommendation-btn" 
					v-if="!recommendations.length && hasRecommendations">
				<wvui-button
					@click="loadRecommendations">Get suggestions for this list</wvui-button>
				</div>
				<p v-if="!hasRecommendations">
					It's not clear what kind of list we are creating. Add pages to this list to get recommendations.
				</p>
				<div v-if="recommendations.length" class="readinglist-recommendation-area">
					Here's some recommendations
					<ul>
						<li v-for="(suggestion,i) in recommendations" :key="i">
							<wvui-typeahead-suggestion
								:suggestion="suggestion"
								:url-generator="generator"
								:show-description="true"
								query=""
								:show-thumbnail="true"
								@click="clickCard"
							>
							</wvui-typeahead-suggestion>
							<button
								type="primary" @click="transferRecommendation(suggestion)">
							add</button> •
							<button
								type="primary" @click="ignoreRecommendation(suggestion)">
							ignore</button> •
							<button
								type="primary" @click="findLinksInPage(suggestion)">
							find links in this page</button>
						</li>
					</ul>
				</div>
			</div>
			<footer>
				<wvui-button v-if="collection"
					type="quiet"
					action="destructive"
					@click="deleteList">
					delete this list
				</wvui-button>
			</footer>
		</div>
		<div v-if="!loaded">
			<intermediate-state>Loading</intermediate-state>
		</div>
	</div>
</template>

<script>
const wvui = require( 'wvui-search' );
const READING_LIST_SPECIAL_PAGE_NAME = 'Special:ReadingLists';
const READING_LISTS_NAME_PLURAL = 'My lists';
const urlGenerator = require( './urlGenerator.js' );
const READING_LIST_TITLE = 'My reading lists';
const HOME_URL = ( new mw.Title( 'ReadingLists', -1 ) ).getUrl();

/**
 * @param {number} id
 * @return {Card}
 */
function getCard( { id, url, name, description, title, thumbnail, project } ) {
	return {
		loaded: false,
		id,
		url,
		project,
		// If it's a list, name
		// If it's a page on the list, title
		title: name || title,
		description: description,
		thumbnail: thumbnail ? {
			mimetype: 'image/jpeg',
			width: 200,
			height: 150,
			url: thumbnail.source
		} : null
	};
}

// @vue/component
console.log(1,wvui.WvuiIcon);
module.exports = {
	name: 'ReadingListPage',
	components: {
		WvuiIcon: wvui.WvuiIcon,
		WvuiButton: wvui.WvuiButton,
		WvuiTypeaheadSuggestion: wvui.WvuiTypeaheadSuggestion,
		ErrorBox: require( './ErrorBox.vue' ),
		IntermediateState: require( './IntermediateState.vue' )
	},
	props: {
		getRecommendationsFromTitle: {
			type: Function,
			required: true
		},
		getRecommendations: {
			type: Function,
			required: true
		},
		api: {
			type: Object,
			required: true
		},
		username: {
			type: String,
			default: ''
		},
		generator: {
			type: Object,
			default: () => urlGenerator
		},
		initialCollection: {
			type: Number,
			required: false
		}
	},
	computed: {
		isDefault: function () {
			return this.isDefault;
		},
		getHomeUrl: function () {
			return HOME_URL;
		},
		viewDescription: function () {
			return this.description ||
				( this.collection ? '' : 'All your reading lists.' );
		},
		viewTitle: function () {
			return this.name || READING_LISTS_NAME_PLURAL;
		},
		emptyMessage: function () {
			return this.collection ?
				'This list has no pages on it. To add pages click the bookmark icon on your favorite articles.' :
				'You have no lists, why not create one?';
		},
		readingListUrl: function () {
			return getReadingListUrl( mw.user.getName() );
		},
		errorMessage: function () {
			switch ( this.errorCode ) {
				case 'readinglists-db-error-list-deleted':
					return 'This list has been deleted.';
				case 'readinglists-db-error-no-such-list':
					return 'This list does not exist.';
				default:
					return 'An unknown error occurred (' + this.errorCode + ')';
			}
		}
	},
	data: function () {
		return {
			hasRecommendations: true,
			recommendations: [],
			ignore: [],
			isNotEditable: false,
			loaded: false,
			initialized: false,
			cards: [],
			name: '',
			description: '',
			collection: this.initialCollection,
			errorCode: 0
		};
	},
	methods: {
		ignoreRecommendation( suggestion ) {
			this.ignore.push( suggestion.title );
			this.recommendations = this.recommendations.filter((s) => s.title !== suggestion.title );
		},
		transferRecommendation( suggestion ) {
			this.cards.push( suggestion );
			this.$emit( 'addToList', this.collection, suggestion.title );
			this.recommendations = this.recommendations.filter((s) => s.title !== suggestion.title );
		},
		findLinksInPage: function ( suggestion ) {
			this.ignore.push( suggestion.title );
			this.getRecommendationsFromTitle( suggestion.title ).then(( cards ) => {
				const index = this.recommendations.findIndex((s) => s.title === suggestion.title);
				const original = this.recommendations;
				this.recommendations = original.slice( 0, index ).concat(
					cards
				).concat( original.slice( index + 1 ) );
			} );
		},
		loadRecommendations() {
			const titles = this.cards.map((card) => card.title);
			if ( !titles.length ) {
				titles.push( this.name );
				titles.push( this.description );
			}
			this.getRecommendations( titles ).then(( cards ) => {
				this.recommendations = cards.filter((card) => !this.ignore.includes(card.title)).slice(0, 10);
				if ( !this.recommendations.length ) {
					this.hasRecommendations = false;
				}
			} );
		},
		navigateHome: function () {
			this.navigate( HOME_URL, READING_LIST_TITLE );
		},
		getUrlFromHref: function ( href ) {
			const query = href.split( '?' )[ 1 ];
			const titleInQuery = query ? query.replace( /title=(.*)(&|$)/, '$1' ) : false;
			if ( titleInQuery ) {
				return '/wiki/' + titleInQuery;
			} else {
				return href;
			}
		},
		clickCard: function ( ev ) {
			const href = this.getUrlFromHref(
				ev.currentTarget.getAttribute( 'href' )
			);
			const isReadingListUrl = href &&
				href.indexOf( READING_LIST_SPECIAL_PAGE_NAME ) > -1;

			if ( isReadingListUrl ) {
				this.navigate( href, null );
				ev.preventDefault();
			}
		},
		createList: function () {
			this.$emit( 'create' );
		},
		deleteList: function () {
			this.$emit( 'delete', this.collection );
		},
		editList: function () {
			this.$emit( 'edit', this.collection, this.name, this.description );
		},
		getState: function () {
			return {
				name: this.name,
				description: this.description,
				collection: this.collection
			};
		},
		load: function () {
			if ( this.loaded ) {
				const state = this.getState();
				document.title = this.name ||
					READING_LISTS_NAME_PLURAL;
				window.history.replaceState(
					state,
					null,
					this.collection ?
						`/wiki/${READING_LIST_SPECIAL_PAGE_NAME}/${this.username}/${this.collection}/${this.name}` :
						`/wiki/${READING_LIST_SPECIAL_PAGE_NAME}/${this.username}`
				);
				return;
			}
			if ( this.collection ) {
				this.api.getCollectionMeta( this.username, this.collection ).then( ( meta ) => {
					this.api.getPages( this.collection ).then( ( pages ) => {
						this.cards = pages.map( ( collection ) => getCard( collection ) );
						this.loaded = true;
						this.name = meta.name;
						this.isNotEditable = meta.default;
						this.description = meta.description;
					} );
				}, function ( code ) {
					this.collection = undefined;
					this.errorCode = code;
					this.loaded = true;
				}.bind( this ) );
			} else {
				this.api.getCollections( this.username, [] ).then( function ( collections ) {
					this.cards = collections.map( ( collection ) => getCard( collection ) );
					this.loaded = true;
				}.bind( this ) );
			}
		},
		reset: function () {
			this.errorCode = 0;
			this.name = '';
			this.isNotEditable = false;
			this.description = '';
			this.cards = [];
			this.collection = false;
			this.loaded = false;
		},
		navigate: function ( url, title ) {
			this.reset();
			const params = url.split( String( READING_LIST_SPECIAL_PAGE_NAME ) + '/' )[ 1 ];
			const paramArray = params ? params.split( '/' ) : [];
			// <username>/<id>/<name>
			this.collection = paramArray[ 1 ];
			this.name = paramArray[ 2 ] ?
				decodeURIComponent( paramArray[ 2 ].replace( /_/g, ' ' ) ) : '';

			history.pushState(
				this.getState(),
				title,
				url
			);
		}
	},
	updated: function () {
		this.load();
	},
	mounted: function () {
		this.load();
		window.addEventListener( 'popstate', function ( ev ) {
			if ( ev.state ) {
				this.reset();
				Object.keys( ev.state ).forEach( function ( key ) {
					this[ key ] = ev.state[ key ];
				}.bind( this ) );
			}
		}.bind( this ) );
	}
};
</script>

<style lang="less">
.readinglist-collection {
	font-size: 16px;

	&-summary {
		color: #555555;
		font-size: 0.85em;
		margin: 7px 0 10px 0;
		text-align: center;
		p {
			margin: 0;
		}

		button {
			margin-top: 10px;
			margin-bottom: 20px;
		}
	}

	footer {
		margin-top: 40px;
		text-align: center;
	}
}

.readinglist-recommendation-area {
	background: #eee;
	padding: 50px;
}

.readinglist-list {
	ul {
		margin: 1em 0 0;
		padding: 0;
	}

	li {
		list-style: none;
		border-top: 1px solid rgba(0, 0, 0, 0.2);
		border-bottom: 1px solid rgba(0, 0, 0, 0.2);

		+ li {
			border-top: none;
		}
	}

	> p {
		text-align: center;
	}
}

.mw-rw-header {
	text-align: center;
	h1 {
		border: 0;
	}
}
.mw-rl-list-links {
	list-style: none;
	margin: 0;

	li {
		display: inline-block;
		padding-left: 8px;

		&:after {
			content: '\2022';
			padding-left: 8px;
			display: inline-block;
		}

		&:last-child::after {
			content: '';
		}
	}
}

.readinglist-recommendation-btn {
	margin-top: 10px;
}
</style>
