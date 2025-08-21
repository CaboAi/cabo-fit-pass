import Image from 'next/image'

type HeroProps = {
  heading: string
  subheading?: string
}

export default function Hero({ heading, subheading }: HeroProps) {
  return (
    <div className="relative w-full h-[420px] md:h-[520px] overflow-hidden rounded-2xl">
      <Image
        src="/images/fitness/cabo1.jpg"
        alt="Cabo arch ocean view"
        fill
        className="object-cover"
        priority
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-black/35" aria-hidden="true" />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-white text-3xl md:text-5xl font-bold">{heading}</h1>
        {subheading ? (
          <p className="mt-2 text-white/90 text-base md:text-lg">{subheading}</p>
        ) : null}
      </div>
    </div>
  )
}
