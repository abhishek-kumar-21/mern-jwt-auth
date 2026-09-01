import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import OtpInput from './OtpInput';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const parseResponse = async (res) => {
    const text = await res.text();
    try { return { data: JSON.parse(text), isJson: true }; }
    catch { return { data: text, isJson: false }; }
};

function ForgotPassword() {
    const navigate = useNavigate();

    const [step, setStep]       = useState('email');
    const [email, setEmail]     = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError]     = useState('');
    const [info, setInfo]       = useState('');
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    const handleSendOtp = async (e) => {
        e?.preventDefault();
        if (cooldown > 0) return;
        
        setError(''); setInfo(''); setLoading(true);
        try {
            const res = await fetch(`${API}/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const { data } = await parseResponse(res);

            if (res.ok) {
                setInfo(data.message);
                setStep('otp');
                startCooldown();
            } else {
                setError(typeof data === 'string' ? data : data?.message || 'Failed to send OTP.');
            }
        } catch {
            setError('Network error. Is the backend running?');
        } finally { setLoading(false); }
    };

    const handleVerifyOtp = async (otp) => {
        if (!newPassword || newPassword.length < 8) {
            setError('Please enter a new password (min 8 characters) before typing the OTP.');
            return;
        }

        setError(''); setLoading(true);
        try {
            const res = await fetch(`${API}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, newPassword }),
            });
            const { data } = await parseResponse(res);
            
            if (res.ok) {
                navigate('/login', { state: { message: 'Password reset successfully! You can now login.' } });
            } else {
                setError(typeof data === 'string' ? data : data?.message || 'Reset failed.');
            }
        } catch {
            setError('Network error.');
        } finally { setLoading(false); }
    };

    const startCooldown = () => {
        setCooldown(60);
        const id = setInterval(() =>
            setCooldown(c => { if (c <= 1) { clearInterval(id); return 0; } return c - 1; }), 1000);
    };

    if (step === 'otp') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl">
                            🔑
                        </div>
                        <CardTitle>Reset Your Password</CardTitle>
                        <CardDescription>
                            {info || `Enter the 6-digit code sent to`} <strong className="text-foreground">{email}</strong>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                placeholder="Enter new password (min 8 chars)"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label className="text-center">Enter OTP to Confirm</Label>
                            <div className="flex justify-center">
                                <OtpInput onComplete={handleVerifyOtp} disabled={loading} />
                            </div>
                        </div>

                        {loading && <p className="text-sm text-muted-foreground text-center">Verifying…</p>}
                        {error && <p className="text-sm font-medium text-destructive text-center">{error}</p>}
                    </CardContent>
                    <CardFooter className="flex gap-2">
                        <Button variant="outline" className="w-full" onClick={() => { setStep('email'); setError(''); setInfo(''); setNewPassword(''); }}>
                            Back
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => handleSendOtp()} disabled={cooldown > 0}>
                            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Forgot Password</CardTitle>
                    <CardDescription>
                        Enter your email address and we&apos;ll send you an OTP to reset your password.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSendOtp} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="m@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Sending OTP…' : 'Send OTP'}
                        </Button>
                    </form>
                    <div className="mt-4 text-center text-sm">
                        Remember your password?{" "}
                        <Link to="/login" className="underline hover:text-primary">
                            Log in
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default ForgotPassword;
