import React, { Component } from 'react'
import { connect } from 'react-redux'
import { translate } from 'react-i18next'
import Sticky from 'react-stickynode'
import _ from 'lodash'
import Modal from 'react-modal'

import { goBackToRestaurant, resetCart } from '../redux/actions'

class RestaurantModal extends Component {

  afterOpenModal() {
    window._paq.push(['trackEvent', 'Checkout', 'openModal', 'changeRestaurant'])
  }

  closeModal() {
    // this.setState({ addressModalIsOpen: false })
  }

  render() {

    return (
      <Modal
        isOpen={ this.props.isOpen }
        onAfterOpen={ this.afterOpenModal.bind(this) }
        onRequestClose={ this.closeModal.bind(this) }
        shouldCloseOnOverlayClick={ false }
        contentLabel={ this.props.t('CART_CHANGE_RESTAURANT_MODAL_LABEL') }
        className="ReactModal__Content--restaurant">
        <div className="text-center">
          <p>
            { this.props.t('CART_CHANGE_RESTAURANT_MODAL_TEXT_LINE_1') }
            <br />
            { this.props.t('CART_CHANGE_RESTAURANT_MODAL_TEXT_LINE_2') }
          </p>
        </div>
        <div className="ReactModal__Restaurant__button">
          <button type="button" className="btn btn-default" onClick={ () => this.props.goBackToRestaurant() }>
            { this.props.t('CART_CHANGE_RESTAURANT_MODAL_BTN_NO') }
          </button>
          <button type="button" className="btn btn-primary" onClick={ () => this.props.resetCart() }>
            { this.props.t('CART_CHANGE_RESTAURANT_MODAL_BTN_YES') }
          </button>
        </div>
      </Modal>
    )
  }
}

function mapStateToProps(state) {

  const hasError = state.errors.hasOwnProperty('restaurant')

  return {
    isOpen: hasError,
  }
}

function mapDispatchToProps(dispatch) {

  return {
    goBackToRestaurant: () => dispatch(goBackToRestaurant()),
    resetCart: () => dispatch(resetCart()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(translate()(RestaurantModal))
