import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

function getSyncedAvatarUrl(src: string | undefined) {
  if (!src || typeof window === "undefined") return src
  try {
    const current = localStorage.getItem("pulse-my-avatar-current")
    if (!current || current === src) return src
    const history: string[] = JSON.parse(localStorage.getItem("pulse-my-avatar-history") || "[]")
    return history.includes(src) ? current : src
  } catch {
    return src
  }
}

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, src, ...props }, ref) => {
  const [resolvedSrc, setResolvedSrc] = React.useState(() => getSyncedAvatarUrl(typeof src === "string" ? src : undefined))

  React.useEffect(() => {
    const update = () => setResolvedSrc(getSyncedAvatarUrl(typeof src === "string" ? src : undefined))
    update()
    window.addEventListener("pulse-avatar-updated", update)
    return () => window.removeEventListener("pulse-avatar-updated", update)
  }, [src])

  return (
    <AvatarPrimitive.Image
      ref={ref}
      src={resolvedSrc}
      className={cn("aspect-square h-full w-full object-cover", className)}
      {...props}
    />
  )
})
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
