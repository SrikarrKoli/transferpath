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
    <div>
      <div className="hall-terms">
        {blocks.map((block) => (
          <section key={block.term}>
            <h2 className="hall-term-name">{block.term}</h2>
            {block.range ? <p className="hall-caption mb-3">{block.range}</p> : null}
            {block.courses.map((course) => (
              <div key={`${block.term}-${course.code ?? course.title}`} className="hall-course">
                {course.code ? <p className="hall-course-code">{course.code}</p> : null}
                <p className="hall-course-title">{course.title}</p>
                {course.status ? <p className="hall-date-meta mt-1">{course.status}</p> : null}
              </div>
            ))}
          </section>
        ))}
      </div>
      {note ? <p className="hall-margin mt-10 max-w-md">{note}</p> : null}
    </div>
  )
}
