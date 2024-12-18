import Image from "next/image"
import { getStrapiMedia } from "@/lib/utils"

interface StrapiImageProps {
    src: string
    alt: string
    height: number
    width: number
    className?: string
}

export default function StrapiImage({
    src,
    alt,
    height,
    width,
    className,
}: Readonly<StrapiImageProps>) {
    const imageUrl = getStrapiMedia(src)
    if (!imageUrl) return null

    return (
        <img
            src={imageUrl}
            alt={alt}
            height={height}
            width={width}
            className={className}
        />
    )
}
