import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const problems = [
  {
    slug: 'parking-lot',
    number: '01',
    title: 'PARKING LOT',
    difficulty: 'EASY',
    estimatedTime: '~45 MIN',
    focus: 'RESPONSIBILITIES · OBJECT RELATIONSHIPS',
    description:
      'Model a multi-floor parking system that handles different vehicle types, spot allocation, entry and exit.',
    context:
      'Design a parking lot system that manages multiple floors, different vehicle types and parking spot allocation. The system should support vehicle entry and exit and track parking availability.',
    requirements: [
      'Support multiple parking floors, each with multiple parking spots.',
      'Handle Motorcycle, Car and Truck vehicle types.',
      'Allocate an appropriate nearest available spot to an incoming vehicle.',
      'Generate a ticket on entry and process payment on exit.',
      'Track availability based on floor and parking spot type.',
    ],
    sections: [
      {
        title: 'CLASSES & RESPONSIBILITIES',
        description: 'Identify the major objects and describe what each one owns.',
        placeholder:
          'ParkingLot — owns floors and coordinates entry…\nVehicle — represents type and dimensions…',
        order: 1,
        evaluationCriteria:
          'Evaluates separation of concerns across ParkingLot, ParkingFloor, ParkingSpot, Vehicle, and Ticket. Checks that domain entities have cohesive responsibilities without god-objects; allocation logic is cleanly encapsulated and distinct from payment and ticketing.',
      },
      {
        title: 'OBJECT RELATIONSHIPS',
        description:
          'Explain containment, associations and the relationships that matter.',
        placeholder:
          'A ParkingFloor contains many ParkingSpots. A Ticket references…',
        order: 2,
        evaluationCriteria:
          'Evaluates correctness of composition vs aggregation: ParkingLot contains ParkingFloors, Floor contains Spots. Spots have associations to Vehicles; Tickets associate Vehicle, Spot, entry timestamp, and active status.',
      },
      {
        title: 'DESIGN DECISIONS',
        description:
          'What trade-off did you make here? Explain the decisions that shape your design.',
        placeholder: 'I chose a strategy for spot allocation because…',
        order: 3,
        evaluationCriteria:
          'Evaluates reasoning behind spot allocation strategies (e.g. nearest vs random, concurrency considerations), spot sizing/compatibility hierarchy, and decoupling of pricing calculation from ticket lifecycle.',
      },
    ],
  },
  {
    slug: 'elevator-system',
    number: '02',
    title: 'ELEVATOR SYSTEM',
    difficulty: 'MEDIUM',
    estimatedTime: '~60 MIN',
    focus: 'STATE MANAGEMENT · COORDINATION',
    description:
      'Coordinate multiple elevators and floor requests while managing movement, direction, capacity and state.',
    context:
      'Design an elevator control system for a multi-floor building with multiple elevator cars. Efficiently coordinate requests while considering direction, movement and capacity.',
    requirements: [
      'Support multiple elevator cars serving multiple floors.',
      'Represent internal and external floor requests.',
      'Coordinate movement, direction and capacity.',
      'Keep elevator state changes explicit and understandable.',
      'Leave room for alternative dispatch strategies.',
    ],
    sections: [
      {
        title: 'CORE ENTITIES',
        description:
          'What are the important objects? What does each object represent?',
        placeholder:
          'ElevatorCar represents movement and capacity…\nRequest represents a destination and direction…',
        order: 1,
        evaluationCriteria:
          'Assesses identification of ElevatorCar, ElevatorController/Dispatcher, HallRequest/CarRequest, Floor, and Door. Checks that representation of hardware state is separated from scheduling logic.',
      },
      {
        title: 'ELEVATOR STATES',
        description:
          'Describe possible states, transitions and the events that cause them.',
        placeholder:
          'Idle → Moving Up when a compatible request is assigned…\nMoving → Stopped when the target floor is reached…',
        order: 2,
        evaluationCriteria:
          'Evaluates completeness of state machine modelling (IDLE, MOVING_UP, MOVING_DOWN, STOPPED, DOOR_OPENING, DOOR_OPEN, EMERGENCY). Validates trigger events and handling of illegal transitions.',
      },
      {
        title: 'REQUEST FLOW',
        description: 'How are requests represented, received and assigned?',
        placeholder:
          'A controller receives a request and asks the dispatcher…',
        order: 3,
        evaluationCriteria:
          'Evaluates handling of internal car panel requests vs external landing requests. Assesses request queue representation, debouncing/deduplication, and decoupling of request ingestion from execution.',
      },
      {
        title: 'DISPATCH / SCHEDULING',
        description: 'How does the system choose an elevator? What trade-offs exist?',
        placeholder:
          'The dispatcher prioritizes cars already moving in the requested direction…',
        order: 4,
        evaluationCriteria:
          'Evaluates dispatch algorithm choices (e.g., SCAN/LOOK elevator algorithm, proximity/ETA minimization vs starvation prevention). Checks strategy pattern usage for pluggable dispatch policies.',
      },
    ],
  },
  {
    slug: 'vending-machine',
    number: '03',
    title: 'VENDING MACHINE',
    difficulty: 'MEDIUM',
    estimatedTime: '~45 MIN',
    focus: 'STATE TRANSITIONS · EXTENSIBILITY',
    description:
      'Design a vending machine that manages inventory, payments, product selection and state transitions.',
    context:
      'Design a vending machine that manages product inventory, selection, payment, dispensing and returning change. The design should remain extensible for additional payment methods or product types.',
    requirements: [
      'Manage products, stock levels and product selection.',
      'Accept payment and validate sufficient funds.',
      'Dispense a product and return change.',
      'Handle cancellation, sold-out products and failed payment.',
      'Support new payment methods without changing the machine core.',
    ],
    sections: [
      {
        title: 'CORE OBJECTS',
        description:
          'What are the main objects in the domain and what do they own?',
        placeholder:
          'Machine coordinates the session…\nInventory owns stock…\nPaymentProcessor owns authorization…',
        order: 1,
        evaluationCriteria:
          'Assesses domain decomposition: VendingMachine (orchestrator/context), Inventory/Slot, Item/Product, Coin/Cash/Card PaymentProcessors, Dispenser. Checks cohesion and minimal coupling.',
      },
      {
        title: 'STATES & TRANSITIONS',
        description:
          'What states can the machine be in? What events trigger transitions?',
        placeholder:
          'READY —select→ AWAITING_PAYMENT —pay→ DISPENSING…',
        order: 2,
        evaluationCriteria:
          'Assesses State Pattern implementation for transitions: IDLE, PRODUCT_SELECTED, MONEY_INSERTED, DISPENSING, CHANGE_RETURNED. Evaluates defensive handling of transaction cancellation, out-of-stock, and insufficient change.',
      },
      {
        title: 'PAYMENT STRATEGY',
        description: 'How should the machine depend on payment behaviour?',
        placeholder:
          'PaymentMethod exposes a charge contract so cash, card and…',
        order: 3,
        evaluationCriteria:
          'Evaluates Strategy Pattern usage for PaymentMethod (CashPayment, CardPayment, UPI/Contactless). Checks payment validation, escrow handling, and change calculation abstractions.',
      },
      {
        title: 'DESIGN FOR EXTENSIBILITY',
        description:
          'What is likely to change, and how would you add it safely?',
        placeholder:
          'New payment methods should be added as implementations, not…',
        order: 4,
        evaluationCriteria:
          'Assesses Open/Closed Principle adherence for adding new dispensing mechanisms (e.g., refrigerated coils, elevators), discount/promotion rules, and telemetry/audit logging without modifying core machine flow.',
      },
    ],
  },
  {
    slug: 'library-management',
    number: '04',
    title: 'LIBRARY MANAGEMENT',
    difficulty: 'EASY',
    estimatedTime: '~45 MIN',
    focus: 'DOMAIN MODELLING · ABSTRACTION',
    description:
      'Model a library system that manages books, members, borrowing and availability.',
    context:
      'Design a library management system that manages books, members, borrowing and availability.',
    requirements: [
      'Represent books and their availability.',
      'Allow members to borrow and return items.',
      'Track loans and due dates.',
      'Keep domain responsibilities clear and cohesive.',
      'Leave room for future borrowing policies or item types.',
    ],
    sections: [
      {
        title: 'DOMAIN ENTITIES',
        description:
          'What are the important entities? What information or behaviour belongs to each?',
        placeholder:
          'Book — title, author and availability…\nMember — identity and active loans…',
        order: 1,
        evaluationCriteria:
          'Evaluates distinction between BookItem (physical copy with barcode/status) vs Book/Metadata (ISBN, title, author). Evaluates Member, Librarian, Loan/BorrowRecord, and Library entities.',
      },
      {
        title: 'RESPONSIBILITIES',
        description:
          'What should each object be responsible for? Avoid mixing unrelated concerns.',
        placeholder: 'Loan owns the borrowing agreement and due date…',
        order: 2,
        evaluationCriteria:
          'Checks separation of catalog management, lending rules, member verification, and fine/overdue calculations. Ensures Loan encapsulates checkout timestamp, due date, return date, and renewal limits.',
      },
      {
        title: 'RELATIONSHIPS',
        description: 'How do books, members and borrowing relate?',
        placeholder:
          'A Member can have many Loans. A Loan references one LibraryItem…',
        order: 3,
        evaluationCriteria:
          'Evaluates relational mapping: Member 1-to-many Loans; Book 1-to-many BookItems; Loan associates Member and BookItem. Checks handling of concurrent checkout attempts on the same physical copy.',
      },
      {
        title: 'ABSTRACTIONS & EXTENSIBILITY',
        description: 'What might change later? How could the design support it?',
        placeholder:
          'LibraryItem could abstract books and future media types…',
        order: 4,
        evaluationCriteria:
          'Assesses abstractions (e.g. LibraryItem interface or base class for Books, DVDs, Magazines, Journals) and Strategy pattern for fine calculation policies or member tier privileges (Student vs Faculty).',
      },
    ],
  },
]

async function main() {
  console.log('Seeding initial LLD problems and sections...')

  for (const prob of problems) {
    const { sections, ...problemData } = prob

    const upsertedProblem = await prisma.problem.upsert({
      where: { slug: prob.slug },
      update: {
        number: problemData.number,
        title: problemData.title,
        difficulty: problemData.difficulty,
        estimatedTime: problemData.estimatedTime,
        focus: problemData.focus,
        description: problemData.description,
        context: problemData.context,
        requirements: problemData.requirements,
      },
      create: problemData,
    })

    for (const sec of sections) {
      await prisma.problemSection.upsert({
        where: {
          problemId_order: {
            problemId: upsertedProblem.id,
            order: sec.order,
          },
        },
        update: {
          title: sec.title,
          description: sec.description,
          placeholder: sec.placeholder,
          evaluationCriteria: sec.evaluationCriteria,
        },
        create: {
          problemId: upsertedProblem.id,
          title: sec.title,
          description: sec.description,
          placeholder: sec.placeholder,
          order: sec.order,
          evaluationCriteria: sec.evaluationCriteria,
        },
      })
    }

    console.log(`Seeded: ${prob.title} with ${sections.length} sections`)
  }

  console.log('Seeding completed successfully.')
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
