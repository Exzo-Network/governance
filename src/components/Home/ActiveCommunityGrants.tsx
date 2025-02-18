import React from 'react'

import useFormatMessage from 'decentraland-gatsby/dist/hooks/useFormatMessage'

import useGrants from '../../hooks/useGrants'
import locations from '../../modules/locations'
import FullWidthButton from '../Common/FullWidthButton'
import GrantCard from '../Grants/GrantCard/GrantCard'

import './ActiveCommunityGrants.css'
import HomeLoader from './HomeLoader'
import HomeSectionHeader from './HomeSectionHeader'

const CURRENT_GRANTS_PER_PAGE = 4

const ActiveCommunityGrants = () => {
  const t = useFormatMessage()
  const { grants, isLoadingGrants } = useGrants()

  return (
    <>
      <div>
        <HomeSectionHeader
          title={t('page.home.active_community_grants.title')}
          description={t('page.home.active_community_grants.description')}
        />
        {isLoadingGrants && (
          <div className="ActiveCommunityGrants__LoaderContainer">
            <HomeLoader>{t('page.home.active_community_grants.fetching')}</HomeLoader>
          </div>
        )}
        {!isLoadingGrants && (
          <div className="ActiveCommunityGrants__Container">
            {grants.current?.slice(0, CURRENT_GRANTS_PER_PAGE).map((grant) => (
              <div className="HoverableCardContainer" key={`HoverableCard__${grant.id}`}>
                <div className="HoverableCardContainer__Content">
                  <GrantCard grant={grant} hoverable />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <FullWidthButton link={locations.grants()}>
        {t('page.home.active_community_grants.view_all_grants')}
      </FullWidthButton>
    </>
  )
}

export default ActiveCommunityGrants
