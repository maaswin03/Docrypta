import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Medibot - AI Health Assistant | Docrypta',
  description: 'Chat with Medibot, your AI-powered health assistant for instant medical insights and wellness guidance.',
}

export default function MedibotLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}