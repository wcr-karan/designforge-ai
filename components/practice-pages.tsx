'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback, useRef } from 'react'

type Slug = 'parking-lot' | 'elevator-system' | 'vending-machine' | 'library-management'
type Section = { title: string; prompt: string; placeholder: string }

const data: Record<Slug, { number: string; title: string; difficulty: string; time: string; focus: string; context: string; requirements: string[]; sections: Section[] }> = {
  'parking-lot': { number: '01', title: 'PARKING LOT', difficulty: 'EASY', time: '~45 MIN', focus: 'RESPONSIBILITIES · OBJECT RELATIONSHIPS', context: 'Design a parking lot system that manages multiple floors, different vehicle types and parking spot allocation. The system should support vehicle entry and exit and track parking availability.', requirements: ['Support multiple parking floors, each with multiple parking spots.', 'Handle Motorcycle, Car and Truck vehicle types.', 'Allocate an appropriate nearest available spot to an incoming vehicle.', 'Generate a ticket on entry and process payment on exit.', 'Track availability based on floor and parking spot type.'], sections: [{ title: 'CLASSES & RESPONSIBILITIES', prompt: 'Identify the major objects and describe what each one owns.', placeholder: 'ParkingLot — owns floors and coordinates entry…\nVehicle — represents type and dimensions…' }, { title: 'OBJECT RELATIONSHIPS', prompt: 'Explain containment, associations and the relationships that matter.', placeholder: 'A ParkingFloor contains many ParkingSpots. A Ticket references…' }, { title: 'DESIGN DECISIONS', prompt: 'What trade-off did you make here? Explain the decisions that shape your design.', placeholder: 'I chose a strategy for spot allocation because…' }] },
  'elevator-system': { number: '02', title: 'ELEVATOR SYSTEM', difficulty: 'MEDIUM', time: '~60 MIN', focus: 'STATE MANAGEMENT · COORDINATION', context: 'Design an elevator control system for a multi-floor building with multiple elevator cars. Efficiently coordinate requests while considering direction, movement and capacity.', requirements: ['Support multiple elevator cars serving multiple floors.', 'Represent internal and external floor requests.', 'Coordinate movement, direction and capacity.', 'Keep elevator state changes explicit and understandable.', 'Leave room for alternative dispatch strategies.'], sections: [{ title: 'CORE ENTITIES', prompt: 'What are the important objects? What does each object represent?', placeholder: 'ElevatorCar represents movement and capacity…\nRequest represents a destination and direction…' }, { title: 'ELEVATOR STATES', prompt: 'Describe possible states, transitions and the events that cause them.', placeholder: 'Idle → Moving Up when a compatible request is assigned…\nMoving → Stopped when the target floor is reached…' }, { title: 'REQUEST FLOW', prompt: 'How are requests represented, received and assigned?', placeholder: 'A controller receives a request and asks the dispatcher…' }, { title: 'DISPATCH / SCHEDULING', prompt: 'How does the system choose an elevator? What trade-offs exist?', placeholder: 'The dispatcher prioritizes cars already moving in the requested direction…' }] },
  'vending-machine': { number: '03', title: 'VENDING MACHINE', difficulty: 'MEDIUM', time: '~45 MIN', focus: 'STATE TRANSITIONS · EXTENSIBILITY', context: 'Design a vending machine that manages product inventory, selection, payment, dispensing and returning change. The design should remain extensible for additional payment methods or product types.', requirements: ['Manage products, stock levels and product selection.', 'Accept payment and validate sufficient funds.', 'Dispense a product and return change.', 'Handle cancellation, sold-out products and failed payment.', 'Support new payment methods without changing the machine core.'], sections: [{ title: 'CORE OBJECTS', prompt: 'What are the main objects in the domain and what do they own?', placeholder: 'Machine coordinates the session…\nInventory owns stock…\nPaymentProcessor owns authorization…' }, { title: 'STATES & TRANSITIONS', prompt: 'What states can the machine be in? What events trigger transitions?', placeholder: 'READY —select→ AWAITING_PAYMENT —pay→ DISPENSING…' }, { title: 'PAYMENT STRATEGY', prompt: 'How should the machine depend on payment behaviour?', placeholder: 'PaymentMethod exposes a charge contract so cash, card and…' }, { title: 'DESIGN FOR EXTENSIBILITY', prompt: 'What is likely to change, and how would you add it safely?', placeholder: 'New payment methods should be added as implementations, not…' }] },
  'library-management': { number: '04', title: 'LIBRARY MANAGEMENT', difficulty: 'EASY', time: '~45 MIN', focus: 'DOMAIN MODELLING · ABSTRACTION', context: 'Design a library management system that manages books, members, borrowing and availability.', requirements: ['Represent books and their availability.', 'Allow members to borrow and return items.', 'Track loans and due dates.', 'Keep domain responsibilities clear and cohesive.', 'Leave room for future borrowing policies or item types.'], sections: [{ title: 'DOMAIN ENTITIES', prompt: 'What are the important entities? What information or behaviour belongs to each?', placeholder: 'Book — title, author and availability…\nMember — identity and active loans…' }, { title: 'RESPONSIBILITIES', prompt: 'What should each object be responsible for? Avoid mixing unrelated concerns.', placeholder: 'Loan owns the borrowing agreement and due date…' }, { title: 'RELATIONSHIPS', prompt: 'How do books, members and borrowing relate?', placeholder: 'A Member can have many Loans. A Loan references one LibraryItem…' }, { title: 'ABSTRACTIONS & EXTENSIBILITY', prompt: 'What might change later? How could the design support it?', placeholder: 'LibraryItem could abstract books and future media types…' }] },
}

function BrandMark() { return <span className="brand-mark" aria-hidden="true"><i /><i /><i /><b /><b /></span> }
function Navbar() { return <header className="site-nav practice-nav"><Link className="brand" href="/"><BrandMark /><span>DESIGNFORGE</span></Link><nav aria-label="Primary navigation"><Link className="nav-link active" href="/">PROBLEMS</Link><Link className="nav-link" href="/attempts">MY ATTEMPTS</Link></nav><button className="avatar" aria-label="Open profile for K">K</button></header> }
function ActionBar({ saved, isSaving, isSubmitting, onSave, onSubmit }: { saved: boolean; isSaving?: boolean; isSubmitting?: boolean; onSave: () => void; onSubmit: () => void }) { return <div className="action-bar"><button className="save-button" onClick={onSave} disabled={isSaving || isSubmitting}>{isSaving ? 'SAVING...' : saved ? 'DRAFT SAVED' : 'SAVE DRAFT'}</button><button className="submit-button" onClick={onSubmit} disabled={isSubmitting}>{isSubmitting ? 'EVALUATING...' : <>SUBMIT DESIGN <span aria-hidden="true">→</span></>}</button></div> }
function EditorSection({ section, value, onChange, index }: { section: Section; value: string; onChange: (v: string) => void; index: number }) { return <section className="editor-section"><div className="editor-heading"><span className="section-index">{String(index + 1).padStart(2, '0')}</span><div><h2>{section.title}</h2><p>{section.prompt}</p></div></div><textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={section.placeholder} aria-label={section.title} /></section> }

function Brief({ problem }: { problem: typeof data[Slug] }) { return <aside className="practice-brief"><p className="eyebrow">PROBLEM BRIEF</p><h1>{problem.title}</h1><p className="brief-context">{problem.context}</p><div className="brief-meta"><span>{problem.difficulty}</span><span>{problem.time}</span><span>{problem.focus}</span></div><div className="requirements"><p className="section-label">REQUIREMENTS</p><ol>{problem.requirements.map((item, i) => <li key={item}><span>{String(i + 1).padStart(2, '0')}</span>{item}</li>)}</ol></div></aside> }
function ParkingWorkspace({ problem, values, setValues }: any) { return <div className="parking-workspace"><div className="vehicle-strip"><span className="section-label">VEHICLE TYPES</span><span>MOTORCYCLE</span><span>CAR</span><span>TRUCK</span></div><div className="editor-grid">{problem.sections.map((s: Section, i: number) => <EditorSection key={s.title} section={s} index={i} value={values[i]} onChange={(v) => setValues((x: string[]) => x.map((a, n) => n === i ? v : a))} />)}</div></div> }
function ElevatorWorkspace({ problem, values, setValues }: any) { return <div className="elevator-workspace"><div className="floor-rail" aria-hidden="true"><span>12</span><i /><span>08</span><i /><span>04</span><i /><span>01</span></div><div className="elevator-editors">{problem.sections.map((s: Section, i: number) => <EditorSection key={s.title} section={s} index={i} value={values[i]} onChange={(v) => setValues((x: string[]) => x.map((a, n) => n === i ? v : a))} />)}</div></div> }
function VendingWorkspace({ problem, values, setValues }: any) { return <div className="vending-workspace"><div className="flow-rail"><span>INPUT</span><i>→</i><span>VALIDATE</span><i>→</i><span>PAYMENT</span><i>→</i><span>DISPENSE</span><i>→</i><span>COMPLETE</span></div><div className="flow-editors">{problem.sections.map((s: Section, i: number) => <EditorSection key={s.title} section={s} index={i} value={values[i]} onChange={(v) => setValues((x: string[]) => x.map((a, n) => n === i ? v : a))} />)}</div></div> }
function LibraryWorkspace({ problem, values, setValues }: any) { return <div className="library-workspace"><div className="entity-map" aria-label="Domain concepts"><span>BOOK</span><span>MEMBER</span><span>LOAN</span><span>AVAILABILITY</span></div><div className="library-editors">{problem.sections.map((s: Section, i: number) => <EditorSection key={s.title} section={s} index={i} value={values[i]} onChange={(v) => setValues((x: string[]) => x.map((a, n) => n === i ? v : a))} />)}</div></div> }

export function PracticePage({ slug }: { slug: Slug }) {
  const staticProblem = data[slug];
  const [problemData, setProblemData] = useState(staticProblem);
  const [sectionIds, setSectionIds] = useState<string[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [attemptStatus, setAttemptStatus] = useState<string>('IN_PROGRESS');
  const [values, setValues] = useState<string[]>(staticProblem.sections.map(() => ''));
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const valuesRef = useState<string[]>(values);
  // Keep values ref updated
  const latestValuesRef = { current: values };

  // Load or resume attempt on mount
  useEffect(() => {
    let isMounted = true;
    async function loadAttempt() {
      try {
        const res = await fetch('/api/attempts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ problemSlug: slug }),
        });
        const json = await res.json();
        if (!isMounted || !json.success || !json.data) return;

        const attempt = json.data;
        setAttemptId(attempt.id);
        setAttemptStatus(attempt.status);

        if (attempt.problem?.sections && attempt.problem.sections.length > 0) {
          const sortedSections = [...attempt.problem.sections].sort((a: any, b: any) => a.order - b.order);
          setSectionIds(sortedSections.map((s: any) => s.id));

          // Restore saved responses if any
          const loadedValues = sortedSections.map((s: any) => {
            const match = attempt.responses?.find((r: any) => r.sectionId === s.id);
            return match ? match.response : '';
          });
          setValues(loadedValues);
        }
      } catch (err) {
        console.error('Failed to load active attempt:', err);
      }
    }

    loadAttempt();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Debounced autosave
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerSave = useCallback(
    async (currentValues: string[], explicitStatus?: 'DRAFT' | 'IN_PROGRESS') => {
      if (!attemptId || sectionIds.length === 0) return;
      setIsSaving(true);
      setStatusMessage('SAVING...');

      try {
        const payload = {
          responses: sectionIds.map((secId, i) => ({
            sectionId: secId,
            response: currentValues[i] || '',
          })),
          status: explicitStatus || (attemptStatus === 'DRAFT' ? 'DRAFT' : 'IN_PROGRESS'),
        };

        const res = await fetch(`/api/attempts/${attemptId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (json.success) {
          setSaved(true);
          if (explicitStatus) {
            setAttemptStatus(explicitStatus);
          }
          setStatusMessage('CHANGES SAVED');
          setTimeout(() => {
            setStatusMessage(null);
          }, 2500);
        } else {
          setStatusMessage('SAVE ERROR');
        }
      } catch (e) {
        console.error('Autosave error:', e);
        setStatusMessage('SAVE ERROR');
      } finally {
        setIsSaving(false);
      }
    },
    [attemptId, sectionIds, attemptStatus]
  );

  // Handle value change with debounced autosave
  const handleValuesChange = (newValues: string[] | ((prev: string[]) => string[])) => {
    setValues((prev) => {
      const resolved = typeof newValues === 'function' ? newValues(prev) : newValues;
      setSaved(false);
      setValidationError(null);

      // Debounce autosave 1500ms
      if (attemptId && sectionIds.length > 0) {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
          triggerSave(resolved);
        }, 1500);
      }
      return resolved;
    });
  };

  // Manual Save Draft action
  const handleSaveDraft = async () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    await triggerSave(values, 'DRAFT');
  };

  // Submit Design action (initial hook for Phase 5, expanded in Phase 6)
  const handleSubmit = async () => {
    // Check if at least one response is non-empty
    const hasAnyContent = values.some((v) => v.trim().length > 0);
    if (!hasAnyContent) {
      setValidationError('Please write your design solution before submitting.');
      return;
    }

    if (!attemptId) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setIsSubmitting(true);
    setStatusMessage('SUBMITTING...');

    try {
      // First save all responses
      await triggerSave(values);

      // Call submit endpoint
      const res = await fetch(`/api/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses: sectionIds.map((secId, i) => ({
            sectionId: secId,
            response: values[i] || '',
          })),
        }),
      });

      const json = await res.json();
      if (json.success) {
        window.location.href = `/attempts/${attemptId}`;
      } else {
        setValidationError(json.error || 'Submission failed. Please try again.');
        setIsSubmitting(false);
        setStatusMessage(null);
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      setValidationError(err.message || 'Submission failed. Your responses have been saved.');
      setIsSubmitting(false);
      setStatusMessage(null);
    }
  };

  const Workspace =
    slug === 'parking-lot'
      ? ParkingWorkspace
      : slug === 'elevator-system'
      ? ElevatorWorkspace
      : slug === 'vending-machine'
      ? VendingWorkspace
      : LibraryWorkspace;

  const displayStatus = isSubmitting
    ? 'SUBMITTED · EVALUATING'
    : statusMessage
    ? statusMessage
    : attemptStatus === 'DRAFT'
    ? 'DRAFT'
    : 'IN PROGRESS';

  return (
    <main className={`practice-shell practice-${slug}`}>
      <Navbar />
      <Link href="/" className="back-link">← ALL PROBLEMS</Link>
      <div className="practice-layout">
        <Brief problem={problemData} />
        <section className="design-workspace">
          <div className="workspace-header">
            <div>
              <p className="eyebrow">YOUR DESIGN</p>
              <p className="workspace-note">Translate the requirements into a clear object model.</p>
              {validationError && (
                <p className="workspace-note" style={{ color: 'var(--destructive, #d9534f)', marginTop: '6px' }}>
                  {validationError}
                </p>
              )}
            </div>
            <span className="workspace-status">{displayStatus}</span>
          </div>
          <Workspace problem={problemData} values={values} setValues={handleValuesChange} />
          <ActionBar
            saved={saved}
            isSaving={isSaving}
            isSubmitting={isSubmitting}
            onSave={handleSaveDraft}
            onSubmit={handleSubmit}
          />
        </section>
      </div>
    </main>
  );
}

export const practiceSlugs = Object.keys(data) as Slug[]
export function isPracticeSlug(value: string): value is Slug { return practiceSlugs.includes(value as Slug) }
