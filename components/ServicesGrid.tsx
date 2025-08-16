import Image from 'next/image'

type Service = {
  key: string
  title: string
  desc: string
  img: string
  alt: string
}

const services: Service[] = [
  { key: 'hiit', title: 'HIIT', desc: 'Short, intense intervals to boost endurance and burn calories.', img: '/hiit.jpg', alt: 'HIIT workout session' },
  { key: 'pilates', title: 'Pilates', desc: 'Core strength, flexibility, and control with guided movements.', img: '/pilates.jpg', alt: 'Pilates reformer workout' },
  { key: 'yoga', title: 'Yoga', desc: 'Balance body and mind with breathwork and mobility training.', img: '/yoga2.jpg', alt: 'Yoga class in studio' },
  { key: 'strength', title: 'Strength', desc: 'Weight training programs to build power and muscle safely.', img: '/strength2.jpg', alt: 'Strength training in gym' },
  { key: 'gym', title: 'Gym Access', desc: 'Full access to modern gym equipment and facilities.', img: '/gym1.jpg', alt: 'Modern gym interior' },
  { key: 'group', title: 'Group Classes', desc: 'Train with others in a fun, motivating group environment.', img: '/group.jpg', alt: 'Group fitness class' },
  { key: 'pickle', title: 'Pickleball', desc: 'Fast paced and social, great for all levels.', img: '/pickle.jpg', alt: 'Pickleball players mid game' },
  { key: 'padel', title: 'Padel', desc: 'Dynamic racquet sport blending tennis and squash.', img: '/padel1.jpg', alt: 'Padel match in progress' }
]

export default function ServicesGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.map(s => (
        <div key={s.key} className="rounded-2xl overflow-hidden border shadow-sm bg-background">
          <div className="relative w-full aspect-[16/9]">
            <Image src={s.img} alt={s.alt} fill className="object-cover" />
          </div>
          <div className="p-4">
            <h3 className="text-lg font-semibold">{s.title}</h3>
            <p className="text-sm text-muted-foreground">{s.desc}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
