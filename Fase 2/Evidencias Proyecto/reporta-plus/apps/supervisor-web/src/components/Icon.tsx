import React from 'react'

type IconProps = {
  C: any
  size?: number
  weight?: string
  className?: string
  style?: React.CSSProperties
}
export default function Icon({ C, ...props }: IconProps) {
  if (!C) return null

  return React.createElement(C, props as any)
}