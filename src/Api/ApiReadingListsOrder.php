<?php

namespace MediaWiki\Extensions\ReadingLists\Api;

use ApiBase;

/**
 * API module for all write operations.
 * Each operation (command) is implemented as a submodule.
 */
class ApiReadingListsOrder extends ApiBase {

	use ApiTrait;

	/** @var string API module prefix */
	private static $prefix = '';

	/**
	 * Entry point for executing the module
	 * @inheritDoc
	 * @return void
	 */
	public function execute() {
		$order = $this->getParameter( 'order' );

		$this->getReadingListRepository( $this->getUser() )->setListOrder( $order );
	}

	/**
	 * @inheritDoc
	 * @return array
	 */
	protected function getAllowedParams() {
		return [
			'order' => [
				self::PARAM_TYPE => 'integer',
				self::PARAM_ISMULTI => true,
				self::PARAM_ISMULTI_LIMIT1 => 1000,
				self::PARAM_ISMULTI_LIMIT2 => 1000,
				self::PARAM_REQUIRED => true,
			],
		];
	}

	/**
	 * @inheritDoc
	 * @return array
	 */
	public function getHelpUrls() {
		return [
			'https://www.mediawiki.org/wiki/Special:MyLanguage/Extension:ReadingLists#API',
		];
	}

	/**
	 * @inheritDoc
	 * @return array
	 */
	protected function getExamplesMessages() {
		return [
			'action=readinglists&command=order&order=8|3|7|5|1&token=123ABC'
				=> 'apihelp-readinglists+orderentry-example-1',
		];
	}

	// The parent module already enforces these but they make documentation nicer.

	/**
	 * @inheritDoc
	 * @return bool
	 */
	public function isWriteMode() {
		return true;
	}

	/**
	 * @inheritDoc
	 * @return bool
	 */
	public function mustBePosted() {
		return true;
	}

	/**
	 * @inheritDoc
	 * @return bool
	 */
	public function isInternal() {
		// ReadingLists API is still experimental
		return true;
	}

}
