'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export default function NotFound() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Page Not Found</CardTitle>
          <CardDescription>
            The page you're looking for doesn't exist or you don't have permission to access it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This could happen if:
          </p>
          <ul className="text-sm text-muted-foreground text-left space-y-1">
            <li>• The URL is incorrect</li>
            <li>• The page has been moved or deleted</li>
            <li>• You don't have permission to access this resource</li>
          </ul>
          <div className="flex flex-col gap-2 pt-4">
            {user ? (
              <Button asChild>
                <Link href={user.user_type === 'doctor' ? '/doctor/dashboard' : '/user/dashboard'}>
                  Go to Dashboard
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/signin">Go to Sign In</Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}