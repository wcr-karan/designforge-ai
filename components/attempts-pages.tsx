'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

type FilterType = 'ALL' | 'REVIEWED' | 'IN PROGRESS' | 'DRAFTS'

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <i />
      <i />
      <i />
      <b />
      <b />
    </span>
  )
}

export function AttemptsNavbar() {
  return (
    <header className="site-nav">
      <Link className="brand" href="/">
        <BrandMark />
        <span>DESIGNFORGE</span>
      </Link>
      <nav aria-label="Primary navigation">
        <Link className="nav-link" href="/">
          PROBLEMS
        </Link>
        <Link className="nav-link active" href="/attempts">
          MY ATTEMPTS
        </Link>
      </nav>
      <button className="avatar" aria-label="Open profile for K">
        K
      </button>
    </header>
  )
}

export function EmptyAttempts() {
  return (
    <div className="empty-attempts">
      <p className="section-label">NO ATTEMPTS YET</p>
      <p>Start with a real-world system design challenge and your work will appear here.</p>
      <Link className="submit-button" href="/">
        EXPLORE PROBLEMS →
      </Link>
    </div>
  )
}

export function AttemptsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL')
  const [attempts, setAttempts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    async function loadAttempts() {
      setIsLoading(true)
      try {
        const filterParam =
          activeFilter === 'REVIEWED'
            ? 'REVIEWED'
            : activeFilter === 'IN PROGRESS'
            ? 'IN_PROGRESS'
            : activeFilter === 'DRAFTS'
            ? 'DRAFTS'
            : 'ALL'

        const res = await fetch(`/api/attempts?filter=${filterParam}`)
        const json = await res.json()
        if (isMounted && json.success && Array.isArray(json.data)) {
          setAttempts(json.data)
        }
      } catch (err) {
        console.error('Failed to load attempts:', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadAttempts()
    return () => {
      isMounted = false
    }
  }, [activeFilter])

  const filters: FilterType[] = ['ALL', 'REVIEWED', 'IN PROGRESS', 'DRAFTS']

  return (
    <main className="page-shell attempts-page">
      <AttemptsNavbar />
      <section className="attempts-intro">
        <div>
          <p className="eyebrow">MY WORK</p>
          <h1>MY ATTEMPTS</h1>
          <p className="intro-description">
            Review your previous design decisions, continue saved drafts, and track how your system
            design thinking evolves.
          </p>
        </div>
        <div className="attempt-count">
          <strong>{String(attempts.length).padStart(2, '0')}</strong>
          <span>ATTEMPTS</span>
        </div>
      </section>

      <div className="attempts-rule" />

      <div className="attempt-filters">
        {filters.map((filter) => (
          <button
            key={filter}
            className={activeFilter === filter ? 'selected' : ''}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      <section className="attempt-list" aria-label="Previous attempts">
        {!isLoading && attempts.length === 0 ? (
          <EmptyAttempts />
        ) : (
          attempts.map((attempt, index) => {
            const isReviewed = attempt.status === 'REVIEWED'
            const href = isReviewed
              ? `/attempts/${attempt.id}`
              : `/practice/${attempt.problem?.slug}`
            const statusLabel =
              attempt.status === 'IN_PROGRESS' ? 'IN PROGRESS' : attempt.status
            const actionLabel = isReviewed ? 'VIEW ATTEMPT →' : 'CONTINUE →'

            return (
              <Link className="attempt-row" href={href} key={attempt.id}>
                <span className="attempt-number">{String(index + 1).padStart(2, '0')}</span>
                <span className="attempt-copy">
                  <strong>{attempt.problem?.title}</strong>
                  <small>{attempt.problem?.focus}</small>
                </span>
                <span className="attempt-meta">
                  <small>{attempt.problem?.difficulty}</small>
                  <small>{attempt.problem?.estimatedTime}</small>
                </span>
                <span className={`attempt-status ${isReviewed ? 'reviewed' : ''}`}>
                  {statusLabel}
                </span>
                <span className="attempt-action">{actionLabel}</span>
              </Link>
            )
          })
        )}
      </section>

      <footer className="footer-note">A practice space for better design decisions.</footer>
    </main>
  )
}

function FeedbackSection({
  number,
  title,
  children,
}: {
  number: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="feedback-section">
      <div className="feedback-heading">
        <span>{number}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  )
}

function ReviewItems({ items }: { items: any[] }) {
  if (!items || items.length === 0) return null

  return (
    <div className="review-items">
      {items.map((item, i) => {
        const title = Array.isArray(item) ? item[0] : item.title
        const text = Array.isArray(item) ? item[1] : item.description
        return (
          <div className="review-item" key={title || i}>
            <span>{String(i + 1).padStart(2, '0')}</span>
            <div>
              <strong>{title}</strong>
              <p>{text}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AttemptSidebar({
  problem,
  status,
  submittedAt,
}: {
  problem: any
  status: string
  submittedAt?: string | null
}) {
  const formattedDate = submittedAt
    ? new Date(submittedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }).toUpperCase()
    : 'IN PROGRESS'

  return (
    <aside className="attempt-sidebar">
      <p className="section-label">PROBLEM</p>
      <p className="sidebar-summary">{problem?.context || problem?.description}</p>
      <p className="section-label sidebar-label">YOUR REQUIREMENTS</p>
      <ol>
        {(problem?.requirements || []).map((item: string, i: number) => (
          <li key={item}>
            <span>{String(i + 1).padStart(2, '0')}</span>
            {item}
          </li>
        ))}
      </ol>
      <div className="sidebar-status">
        <p className="section-label">ATTEMPT STATUS</p>
        <strong>{status === 'IN_PROGRESS' ? 'IN PROGRESS' : status}</strong>
        <span>{status === 'REVIEWED' ? 'SUBMITTED' : 'ACTIVE'}</span>
        <small>{formattedDate}</small>
      </div>
    </aside>
  )
}

export function AttemptDetailsPage({ attemptId }: { attemptId?: string }) {
  const [attempt, setAttempt] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!attemptId) return
    let isMounted = true

    async function loadAttempt() {
      try {
        const res = await fetch(`/api/attempts/${attemptId}`)
        const json = await res.json()
        if (isMounted && json.success && json.data) {
          setAttempt(json.data)
        }
      } catch (err) {
        console.error('Failed to load attempt details:', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadAttempt()
    return () => {
      isMounted = false
    }
  }, [attemptId])

  if (isLoading || !attempt) {
    return (
      <main className="page-shell attempt-details">
        <AttemptsNavbar />
        <Link href="/attempts" className="back-link">
          ← ALL ATTEMPTS
        </Link>
        <header className="attempt-header">
          <div>
            <p className="eyebrow">ATTEMPT REVIEW</p>
            <h1>LOADING ATTEMPT...</h1>
          </div>
        </header>
      </main>
    )
  }

  const problem = attempt.problem
  const aiReview = attempt.aiReview
  const overallScore = aiReview?.overallScore ?? attempt.overallScore ?? '--'
  const assessment = aiReview?.assessment ?? 'UNDER REVIEW'
  const designSummary =
    aiReview?.designSummary ||
    'Your design has been captured and is pending comprehensive evaluation.'
  const strengths = aiReview?.strengths || []
  const improvements = aiReview?.improvements || []

  // Map section reviews
  const sectionReviews = (problem?.sections || []).map((section: any) => {
    const userResp = attempt.responses?.find((r: any) => r.sectionId === section.id)
    const rev = aiReview?.sectionReviews?.find((sr: any) => sr.sectionId === section.id)

    return {
      title: section.title,
      response: userResp?.response || '(No response provided for this section)',
      feedback: rev?.feedback || 'Evaluation pending for this section.',
      score: rev?.score !== undefined ? `${rev.score.toFixed(1)} / 10` : '— / 10',
    }
  })

  const nextRec = aiReview?.nextProblemRecommendation
  const nextSlug = nextRec?.problemSlug || 'parking-lot'
  const nextReason =
    nextRec?.reason ||
    'Practice more system design challenges to refine your domain boundaries and trade-off decisions.'
  const nextTitle = nextSlug.replaceAll('-', ' ').toUpperCase()

  return (
    <main className="page-shell attempt-details">
      <AttemptsNavbar />
      <Link href="/attempts" className="back-link">
        ← ALL ATTEMPTS
      </Link>

      <header className="attempt-header">
        <div>
          <p className="eyebrow">ATTEMPT REVIEW</p>
          <h1>{problem?.title}</h1>
          <p className="attempt-subtitle">
            {problem?.difficulty} · {problem?.estimatedTime} · {attempt.status}
          </p>
        </div>
        <div className="assessment">
          <span>OVERALL ASSESSMENT</span>
          <strong>
            {overallScore}
            <small>/100</small>
          </strong>
          <em>{assessment}</em>
        </div>
      </header>

      <div className="details-layout">
        <AttemptSidebar
          problem={problem}
          status={attempt.status}
          submittedAt={attempt.submittedAt}
        />

        <article className="feedback-content">
          <div className="content-intro">
            <p className="section-label">AI DESIGN REVIEW</p>
            <p>A structured evaluation of your design decisions and reasoning.</p>
          </div>

          <FeedbackSection number="01" title="DESIGN SUMMARY">
            <p className="feedback-copy">{designSummary}</p>
          </FeedbackSection>

          <FeedbackSection number="02" title="WHAT WORKED WELL">
            <ReviewItems items={strengths} />
          </FeedbackSection>

          <FeedbackSection number="03" title="AREAS TO IMPROVE">
            <ReviewItems items={improvements} />
          </FeedbackSection>

          <FeedbackSection number="04" title="SECTION REVIEW">
            <div className="section-reviews">
              {sectionReviews.map((sr: any) => (
                <div className="section-review" key={sr.title}>
                  <h3>{sr.title}</h3>
                  <div>
                    <span>USER RESPONSE</span>
                    <p>{sr.response}</p>
                  </div>
                  <div>
                    <span>AI REVIEW</span>
                    <p>{sr.feedback}</p>
                  </div>
                  <strong>SCORE: {sr.score}</strong>
                </div>
              ))}
            </div>
          </FeedbackSection>

          <section className="next-challenge">
            <p className="section-label">NEXT DESIGN CHALLENGE</p>
            <p>{nextReason}</p>
            <Link className="submit-button" href={`/practice/${nextSlug}`}>
              START {nextTitle} →
            </Link>
          </section>

          <div className="details-actions">
            <Link href="/attempts">← BACK TO ATTEMPTS</Link>
            <Link className="submit-button" href={`/practice/${problem?.slug}`}>
              TRY AGAIN →
            </Link>
          </div>
        </article>
      </div>
    </main>
  )
}
