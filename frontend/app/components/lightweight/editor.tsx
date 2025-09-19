
export const Editor = ({ value, onChange }) => {
  return (
    <textarea 
      className="w-full h-64 p-2 border rounded"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
