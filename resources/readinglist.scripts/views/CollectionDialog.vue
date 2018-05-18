<template>
	<wvui-dialog class="dialog-collection"
		@cancel="hide"
		:simple="false"
		cancel-msg="Cancel"
		title="Add to existing list">
		<intermediate-state v-if="pending">
			Loading
		</intermediate-state>
		<error-box v-if="error">
			An error occurred: {{ error }}
		</error-box>
		<ul>
			<li v-for="(collection, i) in collections"
				:key="i"
				@click="select(collection.id)">
				<wvui-typeahead-suggestion
					@click.prevent
					:suggestion="collection"
					:url-generator="generator"
					:show-description="true"
					query=""
					:show-thumbnail="true"
				>
				</wvui-typeahead-suggestion>
				<input type="checkbox"
					:checked="selected[collection.id]"
					@click.prevent>
			</li>
		</ul>
		<footer>
			<a v-if="manageUrl"
				class="dialog-collection_footer" :href="manageUrl">Manage lists</a>
			&nbsp;
			<a v-if="allowCreate"
				class="dialog-collection_footer"
				@click="createList">Create list</a>
		</footer>
	</wvui-dialog>
</template>

<script>
const wvui = require( 'wvui-search' );
const urlGenerator = require( './urlGenerator.js' );
const WvuiDialog = require( './Dialog.vue' );

// @vue/component
module.exports = {
	name: 'CollectionDialog',
	components: {
		WvuiDialog: WvuiDialog,
		ErrorBox: require( './ErrorBox.vue' ),
		IntermediateState: require( './IntermediateState.vue' ),
		WvuiButton: wvui.WvuiButton,
		WvuiTypeaheadSuggestion: wvui.WvuiTypeaheadSuggestion
	},
	data: function () {
		return {
			error: '',
			pending: true,
			collections: [],
			selected: {}
		};
	},
	methods: {
		createList: function () {
			this.$emit( 'create' );
		},
		hide: function () {
			this.$emit( 'hide' );
		},
		getName: function ( id ) {
			const collections = this.collections.filter( ( c ) => c.id === id );
			if ( !collections.length ) {
				throw new Error( 'Unable to locate collection with id ' + id );
			}
			return collections[ 0 ].title;
		},
		select: function ( id ) {
			this.$emit(
				'select',
				id,
				this.selected[ id ],
				this.getName( id ),
				() => {
					this.selected[ id ] = !this.selected[ id ];
				}
			);
		}
	},
	props: {
		manageUrl: {
			type: String,
			required: false
		},
		asyncGetCollections: {
			type: Function,
			default: () => Promise.reject()
		},
		allowCreate: {
			type: Boolean,
			default: false
		},
		generator: {
			type: Object,
			default: () => urlGenerator
		}
	},
	mounted: function () {
		const selected = {};

		this.asyncGetCollections().then( ( collections ) => {
			collections.forEach( ( collection ) => {
				selected[ collection.id ] = collection.isMember;
			} );
			this.selected = selected;
			this.collections = collections;
			this.pending = false;
		}, ( error ) => {
			this.error = error;
			this.pending = true;
		} );
	}
};
</script>

<style lang="less">
.dialog-collection {
	h2 {
		font-size: 1.2em;
		border: 0;
		font-weight: bold;
		padding: 0;
		margin: 0.5em 0 0;
	}

	footer {
		text-align: center;
		position: absolute;
		bottom: 10px;
		left: 0;
		right: 0;

		a {
			color: #333;
		}
	}

	ul {
		height: ~'calc(100% - 100px)';
		overflow: scroll;
	}

	li {
		display: flex;
		align-items: center;

		.wvui-typeahead-suggestion {
			flex-grow: 1;
		}
	}

	.mw-ui-icon-tick:before {
		background-image: linear-gradient(transparent, transparent), url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22utf-8%22%3F%3E%0D%0A%3C%21--%20Generator%3A%20Adobe%20Illustrator%2018.1.1%2C%20SVG%20Export%20Plug-In%20.%20SVG%20Version%3A%206.00%20Build%200%29%20%20--%3E%0D%0A%3C%21DOCTYPE%20svg%20PUBLIC%20%22-%2F%2FW3C%2F%2FDTD%20SVG%201.1%2F%2FEN%22%20%22http%3A%2F%2Fwww.w3.org%2FGraphics%2FSVG%2F1.1%2FDTD%2Fsvg11.dtd%22%3E%0D%0A%3Csvg%20version%3D%221.1%22%20id%3D%22Layer_1%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%20x%3D%220px%22%20y%3D%220px%22%0D%0A%09%20viewBox%3D%220%200%2051.6%2051.6%22%20enable-background%3D%22new%200%200%2051.6%2051.6%22%20xml%3Aspace%3D%22preserve%22%3E%0D%0A%3Cg%3E%0D%0A%09%3Ccircle%20fill%3D%22%2300AF89%22%20cx%3D%2225.8%22%20cy%3D%2225.8%22%20r%3D%2224.7%22%2F%3E%0D%0A%09%3Cpolygon%20fill%3D%22%23FFFFFF%22%20points%3D%2239%2C18.6%2035.7%2C15.3%2021.3%2C29.8%2015.9%2C24.3%2012.7%2C27.6%2021.3%2C36.3%20%09%22%2F%3E%0D%0A%3C%2Fg%3E%0D%0A%3C%2Fsvg%3E%0D%0A);
	}

	.mw-ui-icon-blank-tick:before {
		background-image: linear-gradient(transparent, transparent), url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22utf-8%22%3F%3E%0D%0A%3C%21--%20Generator%3A%20Adobe%20Illustrator%2018.1.1%2C%20SVG%20Export%20Plug-In%20.%20SVG%20Version%3A%206.00%20Build%200%29%20%20--%3E%0D%0A%3C%21DOCTYPE%20svg%20PUBLIC%20%22-%2F%2FW3C%2F%2FDTD%20SVG%201.1%2F%2FEN%22%20%22http%3A%2F%2Fwww.w3.org%2FGraphics%2FSVG%2F1.1%2FDTD%2Fsvg11.dtd%22%3E%0D%0A%3Csvg%20version%3D%221.1%22%20id%3D%22Layer_1%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%20x%3D%220px%22%20y%3D%220px%22%0D%0A%09%20viewBox%3D%220%200%2051.6%2051.6%22%20enable-background%3D%22new%200%200%2051.6%2051.6%22%20xml%3Aspace%3D%22preserve%22%3E%0D%0A%3Cg%3E%0D%0A%09%3Ccircle%20fill%3D%22%23CCCCCC%22%20cx%3D%2225.8%22%20cy%3D%2225.8%22%20r%3D%2224.7%22%2F%3E%0D%0A%09%3Cpolygon%20fill%3D%22%23FFFFFF%22%20points%3D%2239%2C18.6%2035.7%2C15.3%2021.3%2C29.8%2015.9%2C24.3%2012.7%2C27.6%2021.3%2C36.3%20%09%22%2F%3E%0D%0A%3C%2Fg%3E%0D%0A%3C%2Fsvg%3E%0D%0A);
	}

}
</style>
