import React, {useContext} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';

import {L10nContext} from '../../services/l10n';
import getEstimationSummary from './getEstimationSummary';
import {getUserCount} from '../../state/users/usersSelectors';
import {getEstimationsForCurrentlySelectedStory} from '../../state/estimations/estimationsSelectors';
import {settleEstimation} from '../../state/actions/commandActions';
import {
  getSelectedStoryConsensusValue,
  hasSelectedStoryConsensus
} from '../../state/stories/storiesSelectors';
import {getCardConfigInOrder, getMatchingCardConfig} from '../../state/room/roomSelectors';

import EstimationSummaryCard from './EstimationSummaryCard';
import ValueBadge from '../common/ValueBadge';

import {StyledCards, StyledEstimationSummary, StyledEstimationSummaryList} from './_styled';

/**
 * Displays an overview on how many users did estimate, which cards how often. (after reveal)
 */
const EstimationSummary = ({
  summary,
  usersInRoomCount,
  cardConfig,
  consensusInfo,
  settleEstimation
}) => {
  const {t} = useContext(L10nContext);

  const allValuesSame = Object.keys(summary.estimatedValues).length === 1; // we cannot use "hasConsensus" property, because it is also set after (manually) "settling" the story.
  const settled = consensusInfo.hasConsensus && !allValuesSame;

  return (
    <StyledEstimationSummary data-testid="estimationSummary">
      <h5>{t('estimationSummary')}</h5>

      <StyledEstimationSummaryList>
        <span>
          {t('usersEstimated', {count: summary.estimationCount, total: usersInRoomCount})}
        </span>
        <span>
          {t('numericalAverage', {
            value: typeof summary.average !== 'undefined' ? summary.average : '-'
          })}
        </span>

        {summary.recommendation !== undefined && summary.recommendationCard !== undefined && (
          <span>
            {t('recommendation')}
            <ValueBadge
              cardValue={summary.recommendation}
              cardConfigItem={summary.recommendationCard}
            />
          </span>
        )}

        {allValuesSame && <span>{t('consensusAchieved')}</span>}
        {settled && <span>{t('settledOn', {label: consensusInfo.label})}</span>}
      </StyledEstimationSummaryList>

      <StyledCards>
        {cardConfig.map((cardConfig) => (
          <EstimationSummaryCard
            t={t}
            onClick={() => onCardClick(cardConfig.value)}
            key={'mini-card_' + cardConfig.value}
            cardCfg={cardConfig}
            count={summary.estimatedValues[cardConfig.value]}
          />
        ))}
      </StyledCards>
    </StyledEstimationSummary>
  );

  function onCardClick(value) {
    settleEstimation(value);
  }
};

EstimationSummary.propTypes = {
  summary: PropTypes.object,
  cardConfig: PropTypes.array,
  usersInRoomCount: PropTypes.number,
  consensusInfo: PropTypes.shape({
    hasConsensus: PropTypes.bool,
    value: PropTypes.number,
    label: PropTypes.string
  }),
  settleEstimation: PropTypes.func
};

export default connect(
  (state) => {
    const estimations = getEstimationsForCurrentlySelectedStory(state);
    const cardConfig = getCardConfigInOrder(state);
    const summary = getEstimationSummary(estimations, cardConfig);

    summary.recommendationCard = getMatchingCardConfig(state, summary.recommendation);

    return {
      usersInRoomCount: getUserCount(state),
      cardConfig,
      summary,
      consensusInfo: {
        hasConsensus: hasSelectedStoryConsensus(state),
        value: getSelectedStoryConsensusValue(state),
        label: getMatchingCardConfig(state, getSelectedStoryConsensusValue(state)).label
      }
    };
  },
  {settleEstimation}
)(EstimationSummary);
