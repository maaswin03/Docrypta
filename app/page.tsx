import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirect to signin page as the default landing page
  redirect('/signin')
}