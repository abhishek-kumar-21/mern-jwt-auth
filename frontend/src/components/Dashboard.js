import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { LogOut, User } from 'lucide-react';

function Dashboard() {
    const { user, logout } = useAuth();

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight">Welcome back, {user?.firstName}!</CardTitle>
                    <CardDescription className="text-base mt-2">
                        You are successfully logged in.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mt-4 rounded-lg border bg-card p-4 shadow-sm">
                        <div className="grid gap-2 text-sm">
                            <div className="flex justify-between border-b pb-2">
                                <span className="font-medium text-muted-foreground">Name</span>
                                <span>{user?.firstName} {user?.lastName}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2 pt-2">
                                <span className="font-medium text-muted-foreground">Username</span>
                                <span>@{user?.username}</span>
                            </div>
                            <div className="flex justify-between pt-2">
                                <span className="font-medium text-muted-foreground">Email</span>
                                <span>{user?.email}</span>
                            </div>
                        </div>
                    </div>
                    
                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Your session is valid for <strong>7 days</strong>.
                    </p>
                </CardContent>
                <CardFooter>
                    <Button variant="destructive" className="w-full gap-2" onClick={logout}>
                        <LogOut className="h-4 w-4" />
                        Logout
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

export default Dashboard;
