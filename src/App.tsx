import { useState, useEffect, useCallback } from 'react'
import './App.css'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_ABBREV = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Century anchors (for Gregorian calendar)
const CENTURY_ANCHORS: Record<number, number> = {
  1700: 0, // Sunday
  1800: 5, // Friday
  1900: 3, // Wednesday
  2000: 2, // Tuesday
  2100: 0, // Sunday
  2200: 5, // Friday
  2300: 3, // Wednesday
}

// Doomsday dates for each month (non-leap year)
const DOOMSDAYS = [
  { month: 'January', day: 3, mnemonic: '1/3 (or 1/4 in leap year)' },
  { month: 'February', day: 28, mnemonic: '2/28 (or 2/29 in leap year)' },
  { month: 'March', day: 14, mnemonic: '3/14 (Pi Day)' },
  { month: 'April', day: 4, mnemonic: '4/4' },
  { month: 'May', day: 9, mnemonic: '5/9 (I work 9-5 at 7-11)' },
  { month: 'June', day: 6, mnemonic: '6/6' },
  { month: 'July', day: 11, mnemonic: '7/11 (I work 9-5 at 7-11)' },
  { month: 'August', day: 8, mnemonic: '8/8' },
  { month: 'September', day: 5, mnemonic: '9/5 (I work 9-5 at 7-11)' },
  { month: 'October', day: 10, mnemonic: '10/10' },
  { month: 'November', day: 7, mnemonic: '11/7 (I work 9-5 at 7-11)' },
  { month: 'December', day: 12, mnemonic: '12/12' },
]

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
}

function getDoomsdayForMonth(month: number, year: number): number {
  if (month === 1) return isLeapYear(year) ? 4 : 3
  if (month === 2) return isLeapYear(year) ? 29 : 28
  return DOOMSDAYS[month - 1].day
}

// Odd+11 method to find year's doomsday
function getYearDoomsday(year: number): { doomsday: number; steps: string[] } {
  const steps: string[] = []
  const century = Math.floor(year / 100) * 100
  const anchor = CENTURY_ANCHORS[century] ?? 2
  let yy = year % 100

  steps.push(`Century anchor for ${century}s: ${DAYS[anchor]} (${anchor})`)
  steps.push(`Last two digits: ${yy}`)

  // Odd+11 method
  const originalYY = yy
  if (yy % 2 === 1) {
    yy += 11
    steps.push(`${originalYY} is odd, add 11: ${yy}`)
  } else {
    steps.push(`${originalYY} is even, keep it: ${yy}`)
  }

  yy = yy / 2
  steps.push(`Divide by 2: ${yy}`)

  if (yy % 2 === 1) {
    const prevYY = yy
    yy += 11
    steps.push(`${prevYY} is odd, add 11: ${yy}`)
  } else {
    steps.push(`${yy} is even, keep it: ${yy}`)
  }

  const remainder = yy % 7
  steps.push(`${yy} mod 7 = ${remainder}`)

  const doomsday = (anchor - remainder + 7) % 7
  steps.push(`Subtract from anchor: (${anchor} - ${remainder} + 7) mod 7 = ${doomsday}`)
  steps.push(`Doomsday for ${year}: ${DAYS[doomsday]}`)

  return { doomsday, steps }
}

function getDayOfWeek(month: number, day: number, year: number): number {
  const { doomsday } = getYearDoomsday(year)
  const doomsdayDate = getDoomsdayForMonth(month, year)
  const diff = day - doomsdayDate
  return ((doomsday + diff) % 7 + 7) % 7
}

function generateRandomDate(startYear = 1900, endYear = 2100): { month: number; day: number; year: number } {
  const year = Math.floor(Math.random() * (endYear - startYear + 1)) + startYear
  const month = Math.floor(Math.random() * 12) + 1
  const daysInMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  const day = Math.floor(Math.random() * daysInMonth[month - 1]) + 1
  return { month, day, year }
}

function formatDate(month: number, day: number, year: number): string {
  return `${MONTH_NAMES[month - 1]} ${day}, ${year}`
}

type Mode = 'learn' | 'practice' | 'speed'

function App() {
  const [mode, setMode] = useState<Mode>('learn')
  const [learnStep, setLearnStep] = useState(0)
  const [currentDate, setCurrentDate] = useState(generateRandomDate)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [totalCorrect, setTotalCorrect] = useState(0)
  const [totalAttempts, setTotalAttempts] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [times, setTimes] = useState<number[]>([])
  const [showHint, setShowHint] = useState(false)

  const correctAnswer = getDayOfWeek(currentDate.month, currentDate.day, currentDate.year)
  const { doomsday: yearDoomsday, steps } = getYearDoomsday(currentDate.year)
  const monthDoomsdayDate = getDoomsdayForMonth(currentDate.month, currentDate.year)
  const rawOffsetDays = currentDate.day - monthDoomsdayDate
  const offsetMod = ((rawOffsetDays % 7) + 7) % 7

  const nextQuestion = useCallback(() => {
    setCurrentDate(generateRandomDate())
    setSelectedDay(null)
    setShowAnswer(false)
    setShowHint(false)
    if (mode === 'speed') {
      setStartTime(Date.now())
    }
  }, [mode])

  useEffect(() => {
    if (mode === 'speed') {
      setStartTime(Date.now())
    }
  }, [mode])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode === 'learn') return
      
      // Number keys 1-7 for day selection
      if (e.key >= '1' && e.key <= '7' && !showAnswer) {
        handleDaySelect(parseInt(e.key) - 1)
      }
      // Space for next question
      if (e.code === 'Space' && showAnswer) {
        e.preventDefault()
        nextQuestion()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mode, showAnswer, nextQuestion])

  const handleDaySelect = (dayIndex: number) => {
    if (showAnswer) return

    setSelectedDay(dayIndex)
    setShowAnswer(true)
    setTotalAttempts(prev => prev + 1)

    const isCorrect = dayIndex === correctAnswer

    if (isCorrect) {
      setTotalCorrect(prev => prev + 1)
      setStreak(prev => {
        const newStreak = prev + 1
        setBestStreak(best => Math.max(best, newStreak))
        return newStreak
      })
      if (mode === 'speed' && startTime) {
        const elapsed = (Date.now() - startTime) / 1000
        setTimes(prev => [...prev, elapsed])
      }
    } else {
      setStreak(0)
    }
  }

  const averageTime = times.length > 0
    ? (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1)
    : '—'

  const bestTime = times.length > 0
    ? Math.min(...times).toFixed(1)
    : '—'

  return (
    <div className="app">
      <header>
        <h1>Doomsday Algorithm Trainer</h1>
        <p className="subtitle">Master the Odd+11 method to calculate any day of the week</p>
      </header>

      <nav className="mode-tabs">
        <button
          className={mode === 'learn' ? 'active' : ''}
          onClick={() => setMode('learn')}
        >
          Learn
        </button>
        <button
          className={mode === 'practice' ? 'active' : ''}
          onClick={() => { setMode('practice'); nextQuestion() }}
        >
          Practice
        </button>
        <button
          className={mode === 'speed' ? 'active' : ''}
          onClick={() => { setMode('speed'); nextQuestion(); setTimes([]) }}
        >
          Speed Drill
        </button>
      </nav>

      <main>
        {mode === 'learn' && (
          <div className="learn-section">
            <div className="learn-nav">
              <button
                disabled={learnStep === 0}
                onClick={() => setLearnStep(s => s - 1)}
              >
                ← Previous
              </button>
              <span className="step-indicator">{learnStep + 1} / 4</span>
              <button
                disabled={learnStep === 3}
                onClick={() => setLearnStep(s => s + 1)}
              >
                Next →
              </button>
            </div>

            {learnStep === 0 && (
              <div className="learn-content">
                <h2>Step 1: Century Anchors</h2>
                <p>Each century has an "anchor" day that all Doomsdays in that century are based on:</p>
                <div className="anchor-table">
                  {Object.entries(CENTURY_ANCHORS).map(([century, day]) => (
                    <div key={century} className="anchor-row">
                      <span className="century">{century}s</span>
                      <span className="day">{DAYS[day]}</span>
                    </div>
                  ))}
                </div>
                <p className="mnemonic">
                  <strong>Mnemonic:</strong> "We-in-dis-day" → Wed (1900s), Tue (2000s), Sun (2100s)
                </p>
              </div>
            )}

            {learnStep === 1 && (
              <div className="learn-content">
                <h2>Step 2: The Odd+11 Method</h2>
                <p>To find which day Doomsday falls on for any year:</p>
                <ol className="method-steps">
                  <li>Take the last two digits of the year</li>
                  <li>If odd, add 11</li>
                  <li>Divide by 2</li>
                  <li>If odd, add 11</li>
                  <li>Find remainder when divided by 7</li>
                  <li>Subtract from century anchor (mod 7)</li>
                </ol>
                <div className="example-box">
                  <h3>Example: 2024</h3>
                  <p>Last two digits: <strong>24</strong></p>
                  <p>24 is even, keep: <strong>24</strong></p>
                  <p>Divide by 2: <strong>12</strong></p>
                  <p>12 is even, keep: <strong>12</strong></p>
                  <p>12 mod 7 = <strong>5</strong></p>
                  <p>Tuesday (2) - 5 = <strong>-3 ≡ 4 (Thursday)</strong></p>
                  <p>Doomsday 2024 is <strong>Thursday</strong>!</p>
                </div>
              </div>
            )}

            {learnStep === 2 && (
              <div className="learn-content">
                <h2>Step 3: Doomsday Dates</h2>
                <p>These dates ALWAYS fall on Doomsday (the same day of the week):</p>
                <div className="doomsday-grid">
                  {DOOMSDAYS.map((d, i) => (
                    <div key={i} className="doomsday-item">
                      <span className="doomsday-date">{i + 1}/{d.day}</span>
                      <span className="doomsday-hint">{d.mnemonic}</span>
                    </div>
                  ))}
                </div>
                <p className="tip">
                  <strong>Tip:</strong> "I work 9-5 at 7-11" helps remember May 9, Sept 5, July 11, Nov 7
                </p>
              </div>
            )}

            {learnStep === 3 && (
              <div className="learn-content">
                <h2>Step 4: Putting It Together</h2>
                <p>To find the day of week for any date:</p>
                <ol className="method-steps">
                  <li>Find the Doomsday for that year (Odd+11)</li>
                  <li>Find the nearest Doomsday date in that month</li>
                  <li>Count forward/backward from that Doomsday</li>
                </ol>
                <div className="example-box">
                  <h3>Example: July 20, 1969</h3>
                  <p>Doomsday 1969: <strong>Friday</strong></p>
                  <p>July's Doomsday: <strong>7/11</strong></p>
                  <p>July 20 - July 11 = <strong>9 days</strong></p>
                  <p>Friday + 9 = Friday + 2 = <strong>Sunday</strong></p>
                  <p>Moon landing was on a <strong>Sunday</strong>!</p>
                </div>
                <button className="start-practice" onClick={() => { setMode('practice'); nextQuestion() }}>
                  Start Practicing →
                </button>
              </div>
            )}
          </div>
        )}

        {(mode === 'practice' || mode === 'speed') && (
          <div className="practice-section">
            {mode === 'speed' && (
              <div className="speed-stats">
                <div className="stat">
                  <span className="stat-value">{averageTime}s</span>
                  <span className="stat-label">Average</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{bestTime}s</span>
                  <span className="stat-label">Best</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{times.length}</span>
                  <span className="stat-label">Solved</span>
                </div>
              </div>
            )}

            <div className="question-card">
              <div className="date-display">
                {formatDate(currentDate.month, currentDate.day, currentDate.year)}
              </div>

              {mode === 'practice' && !showAnswer && (
                <button className="hint-btn" onClick={() => setShowHint(!showHint)}>
                  {showHint ? 'Hide Hint' : 'Show Hint'}
                </button>
              )}

              {showHint && !showAnswer && (
                <div className="hint-box">
                  <p><strong>Doomsday for {currentDate.month}/{getDoomsdayForMonth(currentDate.month, currentDate.year)}</strong></p>
                  {steps.map((step, i) => (
                    <p key={i} className="hint-step">{step}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="day-buttons">
              {DAYS.map((day, i) => (
                <button
                  key={day}
                  className={`day-btn ${
                    selectedDay === i
                      ? (i === correctAnswer ? 'correct' : 'incorrect')
                      : (showAnswer && i === correctAnswer ? 'correct' : '')
                  }`}
                  onClick={() => handleDaySelect(i)}
                  disabled={showAnswer}
                >
                  <span className="day-full">{day}</span>
                  <span className="day-abbrev">{DAY_ABBREV[i]}</span>
                </button>
              ))}
            </div>

            {showAnswer && (
              <div className="answer-section">
                <div className={`answer-feedback ${selectedDay === correctAnswer ? 'correct' : 'incorrect'}`}>
                  {selectedDay === correctAnswer ? '✓ Correct!' : `✗ The answer is ${DAYS[correctAnswer]}`}
                </div>

                {mode === 'practice' && (
                  <div className="explanation">
                    <h3>Solution:</h3>
                    {steps.map((step, i) => (
                      <p key={i}>{step}</p>
                    ))}
                    <p>
                      <strong>Month doomsday:</strong>{' '}
                      {MONTH_NAMES[currentDate.month - 1]} {monthDoomsdayDate}
                    </p>
                    <p>
                      <strong>Offset from month doomsday:</strong>{' '}
                      {currentDate.day} - {monthDoomsdayDate} = {rawOffsetDays} days
                    </p>
                    <p>
                      <strong>Offset mod 7:</strong> {rawOffsetDays} mod 7 = {offsetMod}
                    </p>
                    <p>
                      <strong>Final day:</strong> Start from {DAYS[yearDoomsday]} and move {offsetMod}{' '}
                      day{offsetMod === 1 ? '' : 's'} forward → <strong>{DAYS[correctAnswer]}</strong>
                    </p>
                  </div>
                )}

                <button className="next-btn" onClick={nextQuestion}>
                  Next Question →
                </button>
              </div>
            )}

            <div className="stats-bar">
              <div className="stat-item">
                <span className="stat-icon">🔥</span>
                <span>{streak} streak</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">⭐</span>
                <span>Best: {bestStreak}</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">📊</span>
                <span>{totalCorrect}/{totalAttempts} ({totalAttempts > 0 ? Math.round(totalCorrect / totalAttempts * 100) : 0}%)</span>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer>
        <p>Press number keys 1-7 for quick answers • Space for next question</p>
      </footer>
    </div>
  )
}

export default App
