export type HallPlanCourse = {
  code?: string
  title: string
  status: string
}

export type HallPlanBlock = {
  term: string
  range?: string
  courses: HallPlanCourse[]
}

export function HallPlan({
  blocks,
  note,
}: {
  blocks: HallPlanBlock[]
  note?: string
}) {
  if (blocks.length === 0) {
    return <p className="hall-prompt">No courses placed on a term yet.</p>
  }

  return (
    <div className="hall-plan-register">
      <div className="hall-plan-columns" aria-hidden>
        <span>Term</span>
        <span>Course</span>
        <span>Status</span>
      </div>
      <div className="hall-terms">
        {blocks.map((block) => (
          <section key={block.term} className="hall-term-band">
            <header className="hall-term-band-head">
              <h2 className="hall-term-name">{block.term}</h2>
              {block.range ? <p className="hall-caption">{block.range}</p> : null}
            </header>
            {block.courses.length === 0 ? (
              <div className="hall-course hall-course-empty">
                <p className="hall-course-title">No courses filed on this term.</p>
              </div>
            ) : (
              block.courses.map((course) => (
                <div
                  key={`${block.term}-${course.code ?? course.title}`}
                  className="hall-course"
                >
                  <div className="hall-course-main">
                    {course.code ? <p className="hall-course-code">{course.code}</p> : null}
                    <p className="hall-course-title">{course.title}</p>
                  </div>
                  {course.status ? (
                    <p className="hall-date-meta hall-course-status">{course.status}</p>
                  ) : (
                    <span className="hall-course-status" />
                  )}
                </div>
              ))
            )}
          </section>
        ))}
      </div>
      {note ? <p className="hall-margin mt-8 max-w-xl">{note}</p> : null}
    </div>
  )
}
