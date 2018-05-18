<?php

namespace MediaWiki\Extension\ReadingLists;

use SpecialPage;
use Html;
use User;
use OOUI;
use PermissionsError;
use Title;

class SpecialReadingLists extends SpecialPage {
	/**
	 * Construct function
	 */
	public function __construct() {
		parent::__construct( 'ReadingLists' );
		$this->listed = true;
	}

	/**
	 * Render Special Page ReadingLists
	 * @param string $par Parameter submitted as subpage
	 */
	public function execute( $par = '' ) {
		$params = explode( '/', $par );
		$user = $this->getUser();
		$this->setHeaders();
		$this->outputHeader();

		if ( $user->isAnon() ) {
			$this->requireLogin( 'reading-list-purpose' );
		} else {
			if ( $params[0] ) {
				$title = isset( $params[2] ) ? Title::newFromText( $params[2] )->getText() : null;
				$this->executeReadingList( $user, User::newFromName( $params[0] ), $title );
			} else {
				$out = $this->getOutput();
				$out->redirect( SpecialPage::getTitleFor( 'ReadingLists',
					$user->getName() )->getLocalURL() );
			}
		}
	}

	/**
	 * Render readinglist(s) app shell
	 * @param {User} $currentUser to render lists for
	 * @param {String} $owner of list
	 * @param {String} $title of page
	 */
	protected function executeReadingList( $currentUser, $owner, $title = false ) {
		if ( $owner->getId() === $currentUser->getId() ) {
			$out = $this->getOutput();
			$out->addModuleStyles( [ 'special.readinglist.styles' ] );
			$out->addModules( [ 'readinglist.scripts' ] );
			$out->setPageTitle( $this->msg( 'readinglists-special-title' ) );
			$html = Html::element( 'div',
				[ 'class' => 'reading-list__errorbox errorbox' ],
				$this->msg( 'readinglists-error' )->text()
			);
			$html .= Html::element( 'div', [ 'id' => 'reading-list-container' ],
				$this->msg( 'readinglists-loading' )->text()
			);
			$out->addHTML( $html );
		} else {
			// reading lists are private!
			// FIXME: action-readinglist-private
			throw new PermissionsError( 'action-readinglist-private' );
		}
	}

	/**
	 * @return string
	 */
	protected function getGroupName() {
		return 'pages';
	}
}
