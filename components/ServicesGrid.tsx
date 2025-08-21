import Image from 'next/image'

type Service = {
  key: string
  title: string
  desc: string
  img: string
  alt: string
}

const services: Service[] = [
  { key: 'hiit', title: 'HIIT', desc: 'Short, intense intervals to boost endurance and burn calories.', img: '/images/fitness/hiit1.jpg', alt: 'HIIT workout session' },
  { key: 'pilates', title: 'Pilates', desc: 'Core strength, flexibility, and control with guided movements.', img: '/images/fitness/pilates1.jpg', alt: 'Pilates reformer workout' },
  { key: 'yoga', title: 'Yoga', desc: 'Balance body and mind with breathwork and mobility training.', img: '/images/fitness/yoga1.jpg', alt: 'Yoga class in studio' },
  { key: 'strength', title: 'Strength', desc: 'Weight training programs to build power and muscle safely.', img: '/images/fitness/strength1.jpg', alt: 'Strength training in gym' },
  { key: 'gym', title: 'Gym Access', desc: 'Full access to modern gym equipment and facilities.', img: '/images/fitness/gym_access.jpg', alt: 'Modern gym interior' },
  { key: 'group', title: 'Group Classes', desc: 'Train with others in a fun, motivating group environment.', img: '/images/fitness/group1.jpg', alt: 'Group fitness class' },
  { key: 'pickle', title: 'Pickleball', desc: 'Fast paced and social, great for all levels.', img: '/images/fitness/pickle1.jpg', alt: 'Pickleball players mid game' },
  { key: 'padel', title: 'Padel', desc: 'Dynamic racquet sport blending tennis and squash.', img: '/images/fitness/padel1.jpg', alt: 'Padel match in progress' },
  { key: 'crossfit', title: 'CrossFit', desc: 'High-intensity functional movements for strength and conditioning.', img: '/images/fitness/strength2.jpg', alt: 'CrossFit workout session' }
]

export default function ServicesGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {services.map(s => (
        <div key={s.key} className="rounded-2xl overflow-hidden border bg-card">
          <div className="relative w-full aspect-[16/9] sm:aspect-[4/3]">
            <Image src={s.img} alt={s.alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
          </div>
          <div className="p-4 space-y-1">
            <h3 className="text-base font-semibold line-clamp-1">{s.title}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2">{s.desc}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
