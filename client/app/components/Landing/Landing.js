import React, {useContext} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';

import {L10nContext} from '../../services/l10n';
import {getPendingJoinCommandId} from '../../state/commandTracking/commandTrackingSelectors';
import {getActionLog} from '../../state/actionLog/actionLogSelectors';
import appConfig from '../../services/appConfig';
import JoinRoomForm from './JoinRoomForm';

import {
  StyledActionLog,
  StyledEyecatcher,
  StyledLandingInner,
  StyledLanding,
  StyledLoadingSpinner,
  StyledInfoText,
  StyledChangelog
} from './_styled';

/**
 * The "landing" page where the user can enter a room name to join
 */
const Landing = ({waitingForJoin, actionLog}) => {
  const {t} = useContext(L10nContext);
  if (waitingForJoin) {
    return (
      <StyledLanding>
        <StyledLandingInner>
          <Loader t={t} />
        </StyledLandingInner>
      </StyledLanding>
    );
  }

  return (
    <StyledLanding>
      <StyledLandingInner>
        <JoinRoomForm />
       </StyledLandingInner>
    </StyledLanding>
  );
};

Landing.propTypes = {
  waitingForJoin: PropTypes.bool,
  actionLog: PropTypes.array
};

export default connect((state) => ({
  actionLog: getActionLog(state),
  waitingForJoin: !!getPendingJoinCommandId(state)
}))(Landing);

const Loader = ({t}) => (
  <StyledLoadingSpinner>
    <div>{t('loading')}</div>
    <div className="waiting-spinner"></div>
  </StyledLoadingSpinner>
);

Loader.propTypes = {
  t: PropTypes.func
};
