import React, { useEffect, useRef, useState } from 'react'
import Helmet from 'react-helmet'

import Label from 'decentraland-gatsby/dist/components/Form/Label'
import MarkdownTextarea from 'decentraland-gatsby/dist/components/Form/MarkdownTextarea'
import Head from 'decentraland-gatsby/dist/components/Head/Head'
import Markdown from 'decentraland-gatsby/dist/components/Text/Markdown'
import Paragraph from 'decentraland-gatsby/dist/components/Text/Paragraph'
import useAuthContext from 'decentraland-gatsby/dist/context/Auth/useAuthContext'
import useEditor, { assert, createValidator } from 'decentraland-gatsby/dist/hooks/useEditor'
import useFormatMessage from 'decentraland-gatsby/dist/hooks/useFormatMessage'
import { navigate } from 'decentraland-gatsby/dist/plugins/intl'
import { Button } from 'decentraland-ui/dist/components/Button/Button'
import { Field } from 'decentraland-ui/dist/components/Field/Field'
import { Header } from 'decentraland-ui/dist/components/Header/Header'
import { SelectField } from 'decentraland-ui/dist/components/SelectField/SelectField'
import isEmail from 'validator/lib/isEmail'
import isEthereumAddress from 'validator/lib/isEthereumAddress'

import { Governance } from '../../clients/Governance'
import ErrorMessage from '../../components/Error/ErrorMessage'
import MarkdownNotice from '../../components/Form/MarkdownNotice'
import ContentLayout, { ContentSection } from '../../components/Layout/ContentLayout'
import LoadingView from '../../components/Layout/LoadingView'
import NewBadge from '../../components/Proposal/NewBadge/NewBadge'
import CoAuthors from '../../components/Proposal/Submit/CoAuthor/CoAuthors'
import LogIn from '../../components/User/LogIn'
import {
  ProposalGrantCategory,
  ProposalGrantTier,
  isProposalGrantCategory,
  isProposalGrantTier,
  newProposalGrantScheme,
} from '../../entities/Proposal/types'
import { asNumber, isGrantSizeValid, userModifiedForm } from '../../entities/Proposal/utils'
import loader from '../../modules/loader'
import locations from '../../modules/locations'

import './grant.css'
import './submit.css'

type GrantState = {
  title: string
  abstract: string
  category: string | null
  tier: string | null
  size: string | number
  beneficiary: string
  email: string
  description: string
  specification: string
  personnel: string
  roadmap: string
  coAuthors?: string[]
}

const initialState: GrantState = {
  title: '',
  abstract: '',
  category: null,
  tier: null,
  size: '',
  beneficiary: '',
  email: '',
  description: '',
  specification: '',
  personnel: '',
  roadmap: '',
}

const categories = [
  {
    key: ProposalGrantCategory.Community,
    text: ProposalGrantCategory.Community,
    value: ProposalGrantCategory.Community,
  },
  {
    key: ProposalGrantCategory.ContentCreator,
    text: ProposalGrantCategory.ContentCreator,
    value: ProposalGrantCategory.ContentCreator,
  },
  { key: ProposalGrantCategory.Gaming, text: ProposalGrantCategory.Gaming, value: ProposalGrantCategory.Gaming },
  {
    key: ProposalGrantCategory.PlatformContributor,
    text: ProposalGrantCategory.PlatformContributor,
    value: ProposalGrantCategory.PlatformContributor,
  },
]

const tiers = [
  { key: ProposalGrantTier.Tier1, text: ProposalGrantTier.Tier1, value: ProposalGrantTier.Tier1 },
  { key: ProposalGrantTier.Tier2, text: ProposalGrantTier.Tier2, value: ProposalGrantTier.Tier2 },
  { key: ProposalGrantTier.Tier3, text: ProposalGrantTier.Tier3, value: ProposalGrantTier.Tier3 },
  { key: ProposalGrantTier.Tier4, text: ProposalGrantTier.Tier4, value: ProposalGrantTier.Tier4 },
  { key: ProposalGrantTier.Tier5, text: ProposalGrantTier.Tier5, value: ProposalGrantTier.Tier5 },
  { key: ProposalGrantTier.Tier6, text: ProposalGrantTier.Tier6, value: ProposalGrantTier.Tier6 },
]

const schema = newProposalGrantScheme.properties
const edit = (state: GrantState, props: Partial<GrantState>) => {
  return {
    ...state,
    ...props,
  }
}

const validate = createValidator<GrantState>({
  category: (state) => ({
    category:
      assert(!state.category || isProposalGrantCategory(state.category), 'error.grant.category_invalid') || undefined,
  }),
  tier: (state) => ({
    tier: assert(!state.tier || isProposalGrantTier(state.tier), 'error.grant.tier_invalid') || undefined,
  }),
  size: (state) => ({
    size:
      assert(!state.size || Number.isFinite(asNumber(state.size)), 'error.grant.size_invalid') ||
      assert(!state.size || asNumber(state.size) > schema.size.minimum, 'error.grant.size_too_low') ||
      assert(
        !state.size || (!!state.tier && isGrantSizeValid(state.tier, state.size)),
        'error.grant.size_tier_invalid'
      ) ||
      undefined,
  }),
  title: (state) => ({
    title: assert(state.title.length <= schema.title.maxLength, 'error.grant.title_too_large') || undefined,
  }),
  abstract: (state) => ({
    abstract: assert(state.abstract.length <= schema.abstract.maxLength, 'error.grant.abstract_too_large') || undefined,
  }),
  beneficiary: (state) => ({
    beneficiary: assert(!state.beneficiary || isEthereumAddress(state.beneficiary), 'error.grant.beneficiary_invalid'),
  }),
  email: (state) => ({
    email: assert(!state.email || isEmail(state.email), 'error.grant.email_invalid'),
  }),
  description: (state) => ({
    description:
      assert(state.description.length <= schema.description.maxLength, 'error.grant.description_too_large') ||
      undefined,
  }),
  specification: (state) => ({
    specification:
      assert(state.specification.length <= schema.specification.maxLength, 'error.grant.specification_too_large') ||
      undefined,
  }),
  personnel: (state) => ({
    personnel:
      assert(state.personnel.length <= schema.personnel.maxLength, 'error.grant.personnel_too_large') || undefined,
  }),
  roadmap: (state) => ({
    roadmap: assert(state.roadmap.length <= schema.roadmap.maxLength, 'error.grant.roadmap_too_large'),
  }),
  '*': (state) => ({
    category:
      assert(!!state.category, 'error.grant.category_empty') ||
      assert(isProposalGrantCategory(state.category), 'error.grant.category_invalid'),
    tier:
      assert(!!state.tier, 'error.grant.tier_empty') ||
      assert(isProposalGrantTier(state.tier), 'error.grant.tier_invalid'),
    title:
      assert(state.title.length > 0, 'error.grant.title_empty') ||
      assert(state.title.length >= schema.title.minLength, 'error.grant.title_too_short') ||
      assert(state.title.length <= schema.title.maxLength, 'error.grant.title_too_large'),
    size:
      assert(state.size !== '', 'error.grant.size_empty') ||
      assert(Number.isFinite(asNumber(state.size)), 'error.grant.size_invalid') ||
      assert(asNumber(state.size) >= schema.size.minimum, 'error.grant.size_too_low') ||
      assert(isGrantSizeValid(state.tier, state.size), 'error.grant.size_tier_invalid'),
    abstract:
      assert(state.abstract.length > 0, 'error.grant.abstract_empty') ||
      assert(state.abstract.length >= schema.abstract.minLength, 'error.grant.abstract_too_short') ||
      assert(state.abstract.length <= schema.abstract.maxLength, 'error.grant.abstract_too_large'),
    beneficiary:
      assert(state.beneficiary !== '', 'error.grant.beneficiary_empty') ||
      assert(isEthereumAddress(state.beneficiary), 'error.grant.beneficiary_invalid'),
    email:
      assert(state.email !== '', 'error.grant.email_empty') ||
      assert(isEmail(state.email), 'error.grant.email_invalid'),
    description:
      assert(state.description.length > 0, 'error.grant.description_empty') ||
      assert(state.description.length >= schema.description.minLength, 'error.grant.description_too_short') ||
      assert(state.description.length <= schema.description.maxLength, 'error.grant.description_too_large'),
    specification:
      assert(state.specification.length > 0, 'error.grant.specification_empty') ||
      assert(state.specification.length >= schema.specification.minLength, 'error.grant.specification_too_short') ||
      assert(state.specification.length <= schema.specification.maxLength, 'error.grant.specification_too_large'),
    personnel:
      assert(state.personnel.length > 0, 'error.grant.personnel_empty') ||
      assert(state.personnel.length >= schema.personnel.minLength, 'error.grant.personnel_too_short') ||
      assert(state.personnel.length <= schema.personnel.maxLength, 'error.grant.personnel_too_large'),
    roadmap:
      assert(state.roadmap.length > 0, 'error.grant.roadmap_empty') ||
      assert(state.roadmap.length >= schema.roadmap.minLength, 'error.grant.roadmap_too_short') ||
      assert(state.roadmap.length <= schema.roadmap.maxLength, 'error.grant.roadmap_too_large'),
  }),
})

export default function SubmitGrant() {
  const t = useFormatMessage()
  const [account, accountState] = useAuthContext()
  const [state, editor] = useEditor(edit, validate, initialState)
  const [formDisabled, setFormDisabled] = useState(false)
  const preventNavigation = useRef(false)

  const setCoAuthors = (addresses?: string[]) => editor.set({ coAuthors: addresses })

  useEffect(() => {
    preventNavigation.current = userModifiedForm(state.value, initialState)

    if (state.validated) {
      setFormDisabled(true)
      Promise.resolve()
        .then(async () => {
          const size = asNumber(state.value.size)
          const category = state.value.category as ProposalGrantCategory
          const tier = state.value.tier as ProposalGrantTier
          return Governance.get().createProposalGrant({
            ...state.value,
            category,
            tier,
            size,
          })
        })
        .then((proposal) => {
          loader.proposals.set(proposal.id, proposal)
          navigate(locations.proposal(proposal.id, { new: 'true' }), { replace: true })
        })
        .catch((err) => {
          console.error(err, { ...err })
          editor.error({ '*': err.body?.error || err.message })
          setFormDisabled(false)
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.validated, state.value])

  if (accountState.loading) {
    return <LoadingView />
  }

  if (!account) {
    return <LogIn title={t('page.submit_grant.title') || ''} description={t('page.submit_grant.description') || ''} />
  }

  return (
    <ContentLayout small preventNavigation={preventNavigation.current}>
      <Head
        title={t('page.submit_grant.title') || ''}
        description={t('page.submit_grant.description') || ''}
        image="https://decentraland.org/images/decentraland.png"
      />
      <Helmet title={t('page.submit_grant.title') || ''} />
      <ContentSection>
        <Header size="huge">{t('page.submit_grant.title')}</Header>
      </ContentSection>
      <ContentSection className="MarkdownSection--tiny">
        <Markdown>{t('page.submit_grant.description')}</Markdown>
      </ContentSection>
      <ContentSection>
        <Label>{t('page.submit_grant.category_label')}</Label>
        <SelectField
          value={state.value.category || undefined}
          placeholder={t('page.submit_grant.category_placeholder') || undefined}
          onChange={(_, { value }) => editor.set({ category: String(value) })}
          options={categories}
          error={!!state.error.category}
          message={t(state.error.category)}
          disabled={formDisabled}
        />
      </ContentSection>
      <ContentSection>
        <Label>{t('page.submit_grant.tier_label')}</Label>
        <SelectField
          value={state.value.tier || undefined}
          placeholder={t('page.submit_grant.tier_placeholder') || undefined}
          onChange={(_, { value }) => editor.set({ tier: String(value) })}
          options={tiers}
          error={!!state.error.tier}
          message={t(state.error.tier)}
          disabled={formDisabled}
        />
      </ContentSection>
      <ContentSection>
        <Label>{t('page.submit_grant.title_label')}</Label>
        <Field
          value={state.value.title}
          placeholder={t('page.submit_grant.title_placeholder')}
          onChange={(_, { value }) => editor.set({ title: value })}
          onBlur={() => editor.set({ title: state.value.title.trim() })}
          error={!!state.error.title}
          message={
            t(state.error.title) +
            ' ' +
            t('page.submit.character_counter', {
              current: state.value.title.length,
              limit: schema.title.maxLength,
            })
          }
          disabled={formDisabled}
        />
      </ContentSection>
      <ContentSection>
        <Label>
          {t('page.submit_grant.abstract_label')}
          <MarkdownNotice />
        </Label>
        <Paragraph tiny secondary className="details">
          {t('page.submit_grant.abstract_detail')}
        </Paragraph>
        <MarkdownTextarea
          minHeight={175}
          value={state.value.abstract}
          placeholder={t('page.submit_grant.abstract_placeholder')}
          onChange={(_: unknown, { value }: { value: string }) => editor.set({ abstract: value })}
          onBlur={() => editor.set({ abstract: state.value.abstract.trim() })}
          error={!!state.error.abstract}
          message={
            t(state.error.abstract) +
            ' ' +
            t('page.submit.character_counter', {
              current: state.value.abstract.length,
              limit: schema.abstract.maxLength,
            })
          }
          disabled={formDisabled}
        />
      </ContentSection>
      <ContentSection className="GrantSize">
        <Label>{t('page.submit_grant.size_label')}</Label>
        <Paragraph tiny secondary className="details">
          {t('page.submit_grant.size_detail')}
        </Paragraph>
        <Field
          type="number"
          value={state.value.size}
          onChange={(_, { value }) => editor.set({ size: value })}
          onBlur={() => editor.set({ size: state.value.size })}
          error={!!state.error.size}
          action={
            <Paragraph tiny secondary>
              USD
            </Paragraph>
          }
          onAction={() => null}
          message={t(state.error.size)}
          disabled={formDisabled}
        />
      </ContentSection>
      <ContentSection>
        <Label>{t('page.submit_grant.beneficiary_label')}</Label>
        <Paragraph tiny secondary className="details">
          {t('page.submit_grant.beneficiary_detail')}
        </Paragraph>
        <Field
          type="address"
          value={state.value.beneficiary}
          onChange={(_, { value }) => editor.set({ beneficiary: value }, { validate: false })}
          onBlur={() => editor.set({ beneficiary: state.value.beneficiary.trim() })}
          message={t(state.error.beneficiary)}
          error={!!state.error.beneficiary}
          disabled={formDisabled}
        />
      </ContentSection>
      <ContentSection>
        <Label>
          <span className="EmailLabel">
            {t('page.submit_grant.email_label')}
            <NewBadge />
          </span>
        </Label>
        <Paragraph tiny secondary className="details">
          {t('page.submit_grant.email_detail')}
        </Paragraph>
        <Field
          type="email"
          value={state.value.email}
          placeholder={t('page.submit_grant.email_placeholder')}
          onChange={(_, { value }) => editor.set({ email: value })}
          onBlur={() => editor.set({ email: state.value.email.trim() })}
          message={t(state.error.email)}
          error={!!state.error.email}
          disabled={formDisabled}
        />
        <p>{t('page.submit_grant.email_note')}</p>
      </ContentSection>
      <ContentSection>
        <Label>
          {t('page.submit_grant.description_label')}
          <MarkdownNotice />
        </Label>
        <MarkdownTextarea
          minHeight={175}
          value={state.value.description}
          placeholder={t('page.submit_grant.description_placeholder')}
          onChange={(_: unknown, { value }: { value: string }) => editor.set({ description: value })}
          onBlur={() => editor.set({ description: state.value.description.trim() })}
          error={!!state.error.description}
          message={
            t(state.error.description) +
            ' ' +
            t('page.submit.character_counter', {
              current: state.value.description.length,
              limit: schema.description.maxLength,
            })
          }
          disabled={formDisabled}
        />
      </ContentSection>
      <ContentSection>
        <Label>
          {t('page.submit_grant.specification_label')}
          <MarkdownNotice />
        </Label>
        <Paragraph tiny secondary className="details">
          {t('page.submit_grant.specification_detail')}
        </Paragraph>
        <MarkdownTextarea
          minHeight={175}
          value={state.value.specification}
          placeholder={t('page.submit_grant.specification_placeholder')}
          onChange={(_: unknown, { value }: { value: string }) => editor.set({ specification: value })}
          onBlur={() => editor.set({ specification: state.value.specification.trim() })}
          error={!!state.error.specification}
          message={
            t(state.error.specification) +
            ' ' +
            t('page.submit.character_counter', {
              current: state.value.specification.length,
              limit: schema.specification.maxLength,
            })
          }
          disabled={formDisabled}
        />
      </ContentSection>
      <ContentSection>
        <Label>
          {t('page.submit_grant.personnel_label')}
          <MarkdownNotice />
        </Label>
        <Paragraph tiny secondary className="details">
          {t('page.submit_grant.personnel_detail')}
        </Paragraph>
        <MarkdownTextarea
          minHeight={175}
          value={state.value.personnel}
          placeholder={t('page.submit_grant.personnel_placeholder')}
          onChange={(_: unknown, { value }: { value: string }) => editor.set({ personnel: value })}
          onBlur={() => editor.set({ personnel: state.value.personnel.trim() })}
          error={!!state.error.personnel}
          message={
            t(state.error.personnel) +
            ' ' +
            t('page.submit.character_counter', {
              current: state.value.personnel.length,
              limit: schema.personnel.maxLength,
            })
          }
          disabled={formDisabled}
        />
      </ContentSection>
      <ContentSection>
        <Label>
          {t('page.submit_grant.roadmap_label')}
          <MarkdownNotice />
        </Label>
        <Paragraph tiny secondary className="details">
          {t('page.submit_grant.roadmap_detail')}
        </Paragraph>
        <MarkdownTextarea
          minHeight={175}
          value={state.value.roadmap}
          placeholder={t('page.submit_grant.roadmap_placeholder')}
          onChange={(_: unknown, { value }: { value: string }) => editor.set({ roadmap: value })}
          onBlur={() => editor.set({ roadmap: state.value.roadmap.trim() })}
          error={!!state.error.roadmap}
          message={
            t(state.error.roadmap) +
            ' ' +
            t('page.submit.character_counter', {
              current: state.value.roadmap.length,
              limit: schema.roadmap.maxLength,
            })
          }
          disabled={formDisabled}
        />
      </ContentSection>
      <ContentSection>
        <CoAuthors setCoAuthors={setCoAuthors} isDisabled={formDisabled} />
      </ContentSection>
      <ContentSection>
        <Button primary disabled={state.validated} loading={state.validated} onClick={() => editor.validate()}>
          {t('page.submit.button_submit')}
        </Button>
      </ContentSection>
      {state.error['*'] && (
        <ContentSection>
          <ErrorMessage label={t('page.submit.error_label')} errorMessage={t(state.error['*']) || state.error['*']} />
        </ContentSection>
      )}
    </ContentLayout>
  )
}
