
import Image from 'next/image'

export function BannerImage() {
  return (
    <div className="w-full bg-white border-b-4 border-emerald-800">
      <div className="relative w-full h-24 sm:h-32 md:h-40 lg:h-48 xl:h-56">
        <Image
          src="/images/banner-desktop.png"
          alt="Nghệ thuật Quân sự Việt Nam - Journal of Vietnamese Military Art"
          fill
          className="object-contain"
          priority
          sizes="100vw"
        />
      </div>
    </div>
  )
}
