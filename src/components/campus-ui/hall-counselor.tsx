export type HallCounselorFields = {
  school: string
  target: string
  major: string
  gpa: string
  term?: string
}

export function HallCounselor({ fields }: { fields: HallCounselorFields }) {
  return (
    <div className="hall-sheet">
      <label className="hall-field">
        <span className="hall-field-name">Current school</span>
        <span className="hall-field-value">{fields.school}</span>
      </label>
      <label className="hall-field">
        <span className="hall-field-name">Target</span>
        <span className="hall-field-value">{fields.target}</span>
      </label>
      <label className="hall-field">
        <span className="hall-field-name">Major</span>
        <span className="hall-field-value">{fields.major}</span>
      </label>
      <label className="hall-field">
        <span className="hall-field-name">GPA</span>
        <span className="hall-field-value">{fields.gpa}</span>
      </label>
      {fields.term ? (
        <label className="hall-field hall-field-wide">
          <span className="hall-field-name">Entry term</span>
          <span className="hall-field-value">{fields.term}</span>
        </label>
      ) : null}
    </div>
  )
}
