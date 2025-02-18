import React from 'react'

import useFormatMessage from 'decentraland-gatsby/dist/hooks/useFormatMessage'
import TokenList from 'decentraland-gatsby/dist/utils/dom/TokenList'
import toSnakeCase from 'lodash/snakeCase'

import { ProjectHealth } from '../../entities/Updates/types'
import Cancel from '../Icon/Cancel'
import CheckCircle from '../Icon/CheckCircle'
import Warning from '../Icon/Warning'

import './ProjectHealthStatus.css'

const getIconComponent = (health: ProjectHealth) => {
  if (health === ProjectHealth.AtRisk) {
    return Warning
  }

  if (health === ProjectHealth.OffTrack) {
    return Cancel
  }

  return CheckCircle
}

interface Props {
  health: ProjectHealth
}

const ProjectHealthStatus = ({ health }: Props) => {
  const t = useFormatMessage()
  const titleText = t(`page.update_detail.${toSnakeCase(health)}_title`)
  const descriptionText = t(`page.update_detail.${toSnakeCase(health)}_description`)
  const Icon = getIconComponent(health)

  return (
    <div className={TokenList.join(['ProjectHealthStatus', `ProjectHealthStatus--${health}`])}>
      <Icon className="ProjectHealthStatus__Icon" />
      <div>
        <span className={TokenList.join(['ProjectHealthStatus__Title', `ProjectHealthStatus__Title--${health}`])}>
          {titleText}
        </span>
        <p className="ProjectHealthStatus__Description">{descriptionText}</p>
      </div>
    </div>
  )
}

export default ProjectHealthStatus
