import { env } from '../../modules/env'

// Backend-only constants
export const SNAPSHOT_PRIVATE_KEY = process.env.SNAPSHOT_PRIVATE_KEY || ''

// Shared frontend and backend constants
export const SNAPSHOT_SPACE = process.env.GATSBY_SNAPSHOT_SPACE || env('GATSBY_SNAPSHOT_SPACE') || ''
export const SNAPSHOT_ADDRESS = process.env.GATSBY_SNAPSHOT_ADDRESS || env('GATSBY_SNAPSHOT_ADDRESS') || ''
export const SNAPSHOT_DURATION = Number(process.env.GATSBY_SNAPSHOT_DURATION || env('GATSBY_SNAPSHOT_DURATION') || '')
export const SNAPSHOT_URL = process.env.GATSBY_SNAPSHOT_URL || env('GATSBY_SNAPSHOT_URL') || ''
export const SNAPSHOT_QUERY_ENDPOINT =
  process.env.GATSBY_SNAPSHOT_QUERY_ENDPOINT || env('GATSBY_SNAPSHOT_QUERY_ENDPOINT') || ''
export const SNAPSHOT_API = process.env.GATSBY_SNAPSHOT_API || env('GATSBY_SNAPSHOT_API') || ''

// Frontend-only constants
export const SNAPSHOT_DELEGATE_CONTRACT_ADDRESS = env('GATSBY_SNAPSHOT_DELEGATE_CONTRACT_ADDRESS')
