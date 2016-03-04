import React from 'react';
import Immutable from 'immutable';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import classnames from 'classnames';

import { setVisitor, setUsername, leaveRoom } from '../services/actions';
import ActionLog from '../components/ActionLog';

/**
 * This component has own react state.
 * Local state like menuOpen does not belong into our app-state (redux store)
 */
const UserMenu = ({user, setUsername, leaveRoom, setVisitor, userMenuShown}) => {

  const username = user.get('username');
  const isVisitor = user.get('visitor');

  const menuClasses = classnames('user-menu', {
    'user-menu-active': userMenuShown
  });

  let usernameInputField;
  let visitorCheckbox;

  return (

    <div className={menuClasses}>

      <div className='pure-form pure-form-stacked'>
        <h5>Settings</h5>

        <label htmlFor='username'>Username</label>
        <input type='text'
               id='username'
               placeholder='Username...'
               defaultValue={username}
               ref={ref => usernameInputField = ref}
               onKeyPress={handleUsernameKeyPress}/>

        <label htmlFor='visitor'>
          <input type='checkbox'
                 id='visitor'
                 defaultChecked={isVisitor}
                 ref={ref => visitorCheckbox = ref}
          /> Visitor
        </label>

        <button className='pure-button pure-button-primary button-save' onClick={save}>Save</button>
      </div>

      <div className='action-log-wrapper'>
        <h5>Log</h5>
        <ActionLog />
      </div>

      <button className='leave-room-button pure-button pure-button-primary' type='button' onClick={leaveRoom}>
        Leave Room
        <i className='fa fa-sign-out button-icon-right'></i>
      </button>
    </div>
  );

  function handleUsernameKeyPress(e) {
    if (e.key === 'Enter') {
      saveUsername();
    }
  }

  function save() {
    saveUsername();
    setVisitor(visitorCheckbox.checked);
  }

  function saveUsername() {
    // username length minimum is 2 characters
    if (usernameInputField.value && usernameInputField.value.length > 1) {
      setUsername(usernameInputField.value);
    }
  }

};

UserMenu.propTypes = {
  user: React.PropTypes.instanceOf(Immutable.Map),
  userMenuShown: React.PropTypes.bool,
  setVisitor: React.PropTypes.func,
  leaveRoom: React.PropTypes.func,
  setUsername: React.PropTypes.func
};

export default connect(
  state => ({
    user: state.getIn(['users', state.get('userId')]),
    userMenuShown: state.get('userMenuShown')
  }),
  dispatch => bindActionCreators({
    setVisitor,
    leaveRoom,
    setUsername
  }, dispatch)
)(UserMenu);