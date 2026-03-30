import React from 'react'


export function FooterText({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      className={['px-2 text-center text-xs leading-normal text-muted-foreground', className].filter(Boolean).join(' ')}
      {...props}
    >
      StockBot may provide inaccurate information and does not provide
      investment advice.
    </p>
  )
}
