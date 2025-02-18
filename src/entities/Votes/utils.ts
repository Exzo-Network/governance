import { chunk } from 'lodash'
import isUUID from 'validator/lib/isUUID'

import { SnapshotApi } from '../../clients/SnapshotApi'
import { DetailedScores, SnapshotGraphql, SnapshotStrategy, SnapshotVote } from '../../clients/SnapshotGraphql'
import { ProposalAttributes } from '../Proposal/types'

import { ChoiceColor, Vote } from './types'

export type Scores = Record<string, number>
const DELEGATION_STRATEGY_NAME = 'delegation'

export function toProposalIds(ids?: undefined | null | string | string[]) {
  if (!ids) {
    return []
  }

  const list = Array.isArray(ids) ? ids : [ids]

  return list.filter((id) => isUUID(String(id)))
}

export function createVotes(votes: SnapshotVote[], balances: DetailedScores) {
  const balance = new Map(
    Object.keys(balances).map((address) => [address.toLowerCase(), balances[address] || 0] as const)
  )
  return votes.reduce((result, vote) => {
    const address = vote.voter.toLowerCase()
    result[address] = {
      choice: vote.choice,
      vp: balance.get(address)?.totalVp || 0,
      timestamp: Number(vote.created),
    }
    return result
  }, {} as Record<string, Vote>)
}

export function calculateResult(choices: string[], votes: Record<string, Vote>, requiredVotingPower = 0) {
  let totalPower = 0
  const balance: Scores = {}
  const choiceCount: Scores = {}
  for (const choice of choices) {
    balance[choice] = 0
    choiceCount[choice] = 0
  }

  const voters = Object.keys(votes || {})
  for (const voter of voters) {
    const vote = votes![voter]!
    if (vote) {
      totalPower += vote.vp
      balance[choices[vote.choice - 1]] += vote.vp
      choiceCount[choices[vote.choice - 1]] += 1
    }
  }

  let rest = 100
  let maxProgress = 0
  const totalPowerProgress = Math.max(totalPower, requiredVotingPower)
  const result = choices.map((choice, i) => {
    const color = calculateChoiceColor(choice, i)
    const power = balance[choice] || 0
    const votes = choiceCount[choice] || 0

    if (totalPower === 0) {
      return {
        choice,
        color,
        votes,
        power: 0,
        progress: 0,
      }
    }

    if (power === 0) {
      return {
        choice,
        color,
        votes,
        power: 0,
        progress: 0,
      }
    }

    if (power === totalPowerProgress) {
      return {
        choice,
        color,
        votes,
        power,
        progress: 100,
      }
    }

    let progress = Math.floor((power / totalPowerProgress) * 100)
    if (progress === 0) {
      progress = 1
    }

    rest -= progress

    if (progress > maxProgress) {
      maxProgress = progress
    }

    return {
      choice,
      power,
      votes,
      color,
      progress,
    }
  })

  if (rest !== 0 && rest !== 100 && totalPower >= requiredVotingPower) {
    const maxChoiceResults = result.filter((choiceResult) => choiceResult.progress === maxProgress)
    for (const choiceResult of maxChoiceResults) {
      choiceResult.progress += rest / maxChoiceResults.length
    }
  }

  return result
}

export function calculateChoiceColor(value: string, index: number): ChoiceColor {
  switch (value.toLowerCase()) {
    case 'yes':
    case 'for':
    case 'approve':
      return 'approve'

    case 'no':
    case 'against':
    case 'reject':
      return 'reject'

    default:
      return index % 8
  }
}

export function calculateResultWinner(choices: string[], votes: Record<string, Vote>, requiredVotingPower = 0) {
  const result = calculateResult(choices, votes, requiredVotingPower)

  return result.reduce((winner, current) => {
    if (winner.power < current.power) {
      return current
    }

    return winner
  }, result[0])
}

const SI_SYMBOL = ['', 'k', 'M', 'G', 'T', 'P', 'E']

export function abbreviateNumber(vp: number) {
  const tier = (Math.log10(Math.abs(vp)) / 3) | 0

  if (tier == 0) return vp

  const suffix = SI_SYMBOL[tier]
  const scale = Math.pow(10, tier * 3)

  const scaled = vp / scale

  return scaled.toFixed(1) + suffix
}

function getNumber(number: number) {
  return Math.floor(number || 0)
}

export async function getScores(
  addresses: string[],
  block?: string | number,
  space?: string,
  networkId?: string,
  proposalStrategies?: SnapshotStrategy[]
) {
  const formattedAddresses = addresses.map((addr) => addr.toLowerCase())
  const { scores, strategies } = await SnapshotApi.get().getScores(
    formattedAddresses,
    block,
    space,
    networkId,
    proposalStrategies
  )

  const result: DetailedScores = {}
  for (const addr of formattedAddresses) {
    result[addr] = {
      ownVp: 0,
      delegatedVp: Math.round(scores[strategies.findIndex((s) => s.name === DELEGATION_STRATEGY_NAME)][addr]) || 0,
      totalVp: 0,
    }
  }

  for (const score of scores) {
    for (const addr of Object.keys(score)) {
      const address = addr.toLowerCase()
      result[address].totalVp = (result[address].totalVp || 0) + Math.floor(score[addr] || 0)
    }
  }

  for (const address of Object.keys(result)) {
    result[address].ownVp = result[address].totalVp - result[address].delegatedVp
  }

  return result
}

export async function getProposalScores(proposal: ProposalAttributes, addresses: string[]) {
  const results: DetailedScores = {}
  const spaceAndStrategies = await SnapshotGraphql.get().getProposalSpaceAndStrategies(proposal.snapshot_id)
  for (const addressesChunk of chunk(addresses, 500)) {
    const blockchainScores: DetailedScores = await getScores(
      addressesChunk,
      proposal.snapshot_proposal.snapshot,
      proposal.snapshot_space,
      proposal.snapshot_network,
      spaceAndStrategies.strategies
    )

    for (const address of Object.keys(blockchainScores)) {
      const lowercaseAddress = address.toLowerCase()
      if (!results[lowercaseAddress]) {
        results[lowercaseAddress] = { totalVp: 0, delegatedVp: 0, ownVp: 0 }
      }
      results[lowercaseAddress].totalVp += getNumber(blockchainScores[address].totalVp)
      results[lowercaseAddress].delegatedVp += getNumber(blockchainScores[address].delegatedVp)
      results[lowercaseAddress].ownVp += getNumber(blockchainScores[address].ownVp)
    }
  }

  return results
}
