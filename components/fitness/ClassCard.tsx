interface ClassCardProps {
  name: string
  studio: string
  time: string
  duration: number
  credits: number
  difficulty: string
  spotsLeft: number
  onBook?: () => void
}

export default function ClassCard({
  name,
  studio,
  time,
  duration,
  credits,
  difficulty,
  spotsLeft,
  onBook
}: ClassCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-2">{name}</h3>
      <p className="text-orange-600 mb-2">{studio}</p>
      <div className="space-y-1 mb-4">
        <p>Time: {time}</p>
        <p>Duration: {duration} min</p>
        <p>Level: {difficulty}</p>
        <p>Credits: {credits}</p>
        <p>Spots: {spotsLeft}</p>
      </div>
      <button
        onClick={onBook}
        className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700"
      >
        Book Class
      </button>
    </div>
  )
}
