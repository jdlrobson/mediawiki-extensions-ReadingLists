<template>
	<wvui-dialog
		@cancel="cancel"
		:simple="true"
		cancel-msg="Cancel"
		continue-msg="Save"
		@continue="save"
		:continue-disabled="isSaveDisabled"
		:title="getDialogTitle"
	>
	<!--
		-->
		<div class="dialog-collection-editor-panel">
			<wvui-typeahead-suggestion
				class="dialog-collection-editor-panel-preview"
				:suggestion="suggestion"
				:url-generator="generator"
				:show-description="true"
				query=""
				:show-thumbnail="true"
			></wvui-typeahead-suggestion>
			<label>Name</label>
			<wvui-input
				v-model="title"
				placeholder="Name this list"
				class="dialog-collection-editor-panel-input"></wvui-input>
			<label>Description</label>
			<wvui-input v-model="description"
				placeholder="Describe this list"
				class="dialog-collection-input dialog-collection-editor-panel-input-description"
			></wvui-input>
		</div>
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
		WvuiInput: wvui.WvuiInput,
		WvuiButton: wvui.WvuiButton,
		WvuiTypeaheadSuggestion: wvui.WvuiTypeaheadSuggestion
	},
	data() {
		return {
			title: this.initialTitle,
			description: this.initialDescription
		};
	},
	computed: {
		getDialogTitle() {
			return !this.initialDescription ? 'Create reading list' : undefined;
		},
		isSaveDisabled() {
			return !this.title;
		},
		suggestion() {
			return {
				title: this.title,
				description: this.description
			};
		}
	},
	props: {
		initialTitle: {
			type: String,
			default: ''
		},
		initialDescription: {
			type: String,
			default: ''
		},
		generator: {
			type: Object,
			default: () => urlGenerator
		}
	},
	methods: {
		cancel() {
			this.$emit( 'hide' );
		},
		save() {
			this.$emit( 'save', this.title, this.description );
		}
	}
};
</script>

<style lang="less">
.dialog-collection-editor-panel {
	min-width: 300px;

    &-preview {
        border-top: 1px solid rgba(0, 0, 0, 0.2);
        border-bottom: 1px solid rgba(0, 0, 0, 0.2);
    }

    label {
        margin-top: 2em;
        font-weight: bold;
        margin-bottom: 0.5em;
        display: block;
    }

    &-input {
        margin-bottom: 20px;
        display: block;

        &-description {
            margin-bottom: 20px;
        }
    }
}

</style>
