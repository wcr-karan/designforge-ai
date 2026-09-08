'use client'

import { useMemo, useState } from 'react'

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'

type Problem = {
  id: string
  title: string
  difficulty: Difficulty
  time: string
  description: string
  focus: string
}

const problems: Problem[] = [
  {
    id: '01',
    title: 'PARKING LOT',
    difficulty: 'EASY',
    time: '~45 MIN',
    description:
      'Model a multi-floor parking system that handles different vehicle types, spot allocation, entry and exit.',
    focus: 'RESPONSIBILITIES · RELATIONSHIPS',
  },
  {
    id: '02',
    title: 'ELEVATOR SYSTEM',
    difficulty: 'MEDIUM',
    time: '~60 MIN',
    description:
      'Coordinate multiple elevators and floor requests while managing movement, direction, capacity and state.',
    focus: 'STATE MANAGEMENT · COORDINATION',
  },
  {
    id: '03',
    title: 'VENDING MACHINE',
    difficulty: 'MEDIUM',
    time: '~45 MIN',
    description:
      'Design a vending machine that manages inventory, payments, product selection and state transitions.',
    focus: 'STATE TRANSITIONS · EXTENSIBILITY',
  },
  {
    id: '04',
    title: 'LIBRARY MANAGEMENT',
    difficulty: 'EASY',
    time: '~45 MIN',
    description:
      'Model a library system that manages books, members, borrowing and availability.',
    focus: 'DOMAIN MODELLING · ABSTRACTION',
  },
]

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

function Navbar() {
  return (
    <header className="site-nav">
      <a className="brand" href="#top" aria-label="DesignForge home">
        <BrandMark />
        <span>DESIGNFORGE</span>
      </a>
      <nav aria-label="Primary navigation">
        <a className="nav-link active" href="#problems">PROBLEMS</a>
        <a className="nav-link" href="/attempts">MY ATTEMPTS</a>
      </nav>
      <button className="avatar" aria-label="Open profile for K">K</button>
    </header>
  )
}

function Filters({ active, onChange }: { active: Difficulty | 'ALL'; onChange: (value: Difficulty | 'ALL') => void }) {
  const filters: Array<Difficulty | 'ALL'> = ['ALL', 'EASY', 'MEDIUM', 'HARD']
  return (
    <div className="filters" role="group" aria-label="Filter problems by difficulty">
      {filters.map((filter) => (
        <button
          key={filter}
          className={`filter ${active === filter ? 'selected' : ''}`}
          onClick={() => onChange(filter)}
          aria-pressed={active === filter}
        >
          {filter}
        </button>
      ))}
    </div>
  )
}

function ProblemRow({ problem }: { problem: Problem }) {
  return (
    <a className="problem-row" href={`/practice/${problem.title.toLowerCase().replaceAll(' ', '-')}`}>
      <span className="problem-number">{problem.id}</span>
      <span className="problem-copy">
        <strong>{problem.title}</strong>
        <span className="problem-description">{problem.description}</span>
        <span className="problem-focus">{problem.focus}</span>
      </span>
      <span className="problem-meta">
        <span className={`difficulty ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span>
        <span className="time">{problem.time}</span>
      </span>
      <span className="begin">BEGIN PRACTICE <span aria-hidden="true">→</span></span>
    </a>
  )
}

export function ProblemsPage() {
  const [activeFilter, setActiveFilter] = useState<Difficulty | 'ALL'>('ALL')
  const visibleProblems = useMemo(
    () => activeFilter === 'ALL' ? problems : problems.filter((problem) => problem.difficulty === activeFilter),
    [activeFilter],
  )

  return (
    <main id="top" className="page-shell">
      <Navbar />
      <section className="intro" aria-labelledby="page-title">
        <div className="intro-copy">
          <p className="eyebrow">LLD PRACTICE</p>
          <h1 id="page-title">Practice architecture.<br />Improve through iteration.</h1>
          <p className="intro-description">Choose a real-world design challenge, build your approach, and get feedback that helps you reason about better engineering decisions.</p>
        </div>
        <div className="availability" aria-label="4 challenges available">
          <span className="availability-count">04</span>
          <span className="availability-label">CHALLENGES<br />AVAILABLE</span>
        </div>
      </section>
      <div className="signature" aria-hidden="true"><i /><span /><b /><span /><i /></div>
      <section id="problems" className="library" aria-labelledby="library-title">
        <div className="library-header">
          <div>
            <p id="library-title" className="section-label">PRACTICE PROBLEMS</p>
            <p className="section-count">{String(visibleProblems.length).padStart(2, '0')} CHALLENGES</p>
          </div>
          <Filters active={activeFilter} onChange={setActiveFilter} />
        </div>
        <div className="problem-list">
          {visibleProblems.map((problem) => <ProblemRow key={problem.id} problem={problem} />)}
        </div>
      </section>
      <footer className="footer-note">A practice space for better design decisions.</footer>
    </main>
  )
}
