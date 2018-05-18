<template>
	<div :class="rootClass">
		<div class="wvui-dialog-shield" @click="onCancel"></div>
		<div class="wvui-dialog-container" @click.stop>
			<header class="wvui-dialog-container-heading">
				<h2>{{ title }}</h2>
				<wvui-icon
					v-if="cancelMsg && !simple"
					class="wvui-dialog-container-heading-cancel"
					:icon="closeIcon"
					@click="onCancel">{{ cancelMsg }}</wvui-icon>
					<wvui-button
						v-if="continueMsg"
						:disabled="continueDisabled"
						class="wvui-dialog-container-heading-continue"
						action="progressive" type="primary"
						@click="onContinue">{{ continueMsg }}</wvui-button>
			</header>
			<div class="wvui-dialog-container-content">
				<slot></slot>
			</div>
			<nav class="wvui-dialog-container-footer">
					<wvui-button
						v-if="cancelMsg && simple"
						class="wvui-dialog-container-button"
						@click="onCancel">{{ cancelMsg }}</wvui-button>
					<wvui-button
						v-if="continueMsg"
						:disabled="continueDisabled"
						class="wvui-dialog-container-button"
						action="progressive" type="primary"
						@click="onContinue">{{ continueMsg }}</wvui-button>
			</nav>
		</div>
	</div>
</template>


<script>
const wvuiIconClose = 'M4.34 2.93l12.73 12.73-1.41 1.41L2.93 4.35z M17.07 4.34L4.34 17.07l-1.41-1.41L15.66 2.93z';

module.exports = {  
	name: 'WvuiDialog',
	components: {
		WvuiButton: require( 'wvui-search' ).WvuiButton,
		WvuiIcon: require( 'wvui-search' ).WvuiIcon
	},
	computed: {
		rootClass() {
			return {
				'wvui-dialog': true,
				'wvui-dialog-simple': this.simple,
				'wvui-dialog-complex': !this.simple
			};
		}
	},
	methods: {
		onContinue() {
			this.$emit( 'continue' )
		},
		onCancel() {
			this.$emit( 'cancel' );
		}
	},
	props: {
		continueDisabled: {
			type: Boolean,
			default: false
		},
		closeIcon: {
			type: String,
			default: wvuiIconClose
		},
		continueMsg: {
			type: String,
			default: ''
		},
		cancelMsg: {
			type: String,
			default: ''
		},
		title: {
			type: String,
			default: 'Title of dialog'
		},
		simple: {
			type: Boolean,
			default: true
		}
	}
};
</script>

<style lang="less">
.wvui-dialog {
	z-index: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
}

.wvui-dialog-shield,
.wvui-dialog {
	position: fixed;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
}

.wvui-dialog-shield {
	opacity: 0.5;
	background: #ccc;
}

.wvui-dialog-container > * {
	margin: 0;
}

.wvui-dialog-container-button + .wvui-dialog-container-button {
	margin-top: 0.5em;
}

.wvui-dialog-container-heading {
	display: flex;

	h2 {
		flex-grow: 1;
		margin: 0;
	}
}


.wvui-dialog-container {
	position: absolute;
	background: white;
	margin: auto;

	&-heading-continue {
		display: none;
	}
}

.wvui-dialog-simple {
	align-items: center;

	.wvui-dialog-container-heading {
		margin: 0 0 1.25em;
	}

	.wvui-dialog-container {
		padding: 1.5em;
		position: absolute;
		background: white;
		margin: auto;
		max-width: 400px;
	}
}

.wvui-dialog-complex {
	.wvui-dialog-container {
		height: 100%;
		max-height: 500px;
		&-content {
			overflow: scroll;
			height: 100%;
		}
	}
}

@media all and ( max-width: 400px ) {
	.wvui-dialog-complex {
		align-items: flex-start;
		.wvui-dialog-container {
			width: 100%;
			padding-bottom: 40px;
			box-sizing: border-box;

			&-heading {

				&-cancel {
					order: 1;
					padding: 16px;
				}

				h2 {
					order: 2;
					margin-left: 16px;
					padding: 16px 0;
				}

				&-continue {
					display: block;
					order: 3;
				}
			}

			&-content {
				padding: 16px;
				box-sizing: border-box;
			}

			&-footer {
				display: none;
			}
		}
	}
}

@media all and ( min-width: 400px ) {
	.wvui-dialog-complex {

		.wvui-dialog-container {
			width: 500px;
			max-width: 500px;

			&-heading {
				margin: 1.25em 1.25em 1em;
			}
			&-content {
				margin: 0 1.25em;
			}
			&-footer {
				border-top: 1px solid gray;
				padding: 1.25em;
				text-align: right;
			}
		}
	}
}


.wvui-dialog-container-footer {
	margin-top: 1em;
}
</style>
