import React from 'react'

import Markdown from 'decentraland-gatsby/dist/components/Text/Markdown'
import useFormatMessage from 'decentraland-gatsby/dist/hooks/useFormatMessage'

import Helper from '../../Helper/Helper'
import VotingPower from '../../Token/VotingPower'
import Username from '../../User/Username'

import './DelegationsLabel.css'

interface InfoMessageValues {
  delegate?: string
  own_vp?: number
  delegators_that_voted?: number
  total_delegators?: number
  delegators_without_vote?: number
}

export interface DelegationsLabelProps {
  delegateLabel?: { id: string; values?: any }
  delegatorsLabel?: { id: string; values?: any }
  infoMessage?: { id: string; values?: InfoMessageValues }
}

function formatInfoMessageValues(values?: any) {
  const formattedInfoValues: {
    delegate?: JSX.Element
    own_vp?: JSX.Element
    delegated_vp?: JSX.Element
  } = {}

  if (values) {
    if (values.delegate) {
      formattedInfoValues.delegate = (
        <Username className="DelegationsLabel__InfoMessage" address={values.delegate} variant="address" />
      )
    }
    if (values.own_vp) {
      formattedInfoValues.own_vp = <VotingPower className="DelegationsLabel__InfoMessage" value={values.own_vp} />
    }
    if (values.delegated_vp) {
      formattedInfoValues.delegated_vp = (
        <VotingPower className="DelegationsLabel__InfoMessage" value={values.delegated_vp} />
      )
    }
  }
  return { ...values, ...formattedInfoValues }
}

const DelegationsLabel = ({ delegateLabel, delegatorsLabel, infoMessage }: DelegationsLabelProps) => {
  const t = useFormatMessage()
  const formattedInfoValues = formatInfoMessageValues(infoMessage?.values)

  return (
    <div className="DelegationsLabel">
      <span className="DelegationsLabel__TextContainer">
        {delegateLabel && (
          <Markdown className="DelegationsLabel__Text">{t(delegateLabel.id, delegateLabel.values)}</Markdown>
        )}
        {delegatorsLabel && (
          <Markdown className="DelegationsLabel__Text">{t(delegatorsLabel.id, delegatorsLabel.values)}</Markdown>
        )}
      </span>

      {infoMessage && (
        <Helper
          text={t(infoMessage.id, formattedInfoValues)}
          position="left center"
          size="14"
          containerClassName="DelegationsLabel__HelperContainer"
          iconClassName="DelegationsLabel__HelperIcon"
        />
      )}
    </div>
  )
}

export default DelegationsLabel
