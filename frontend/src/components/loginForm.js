import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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

function LoginForm() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const location = useLocation();

    // step: 'form' | 'otp_verify_email'
    const [step, setStep]       = useState('form');
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [userId, setUserId]   = useState(null);
    const [error, setError]     = useState('');
    const [info, setInfo]       = useState(location.state?.message || '');
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    const handleChange = (e) =>
        setFormData(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(''); setInfo(''); setLoading(true);
        try {
            const res = await fetch(`${API}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const { data } = await parseResponse(res);

            if (res.ok) {
                login(data.user, data.token);
                navigate('/dashboard');
            } else if (res.status === 403 && data?.requiresVerification) {
                setUserId(data.userId);
                setInfo(data.message);
                setStep('otp_verify_email');
                startCooldown();
            } else {
                setError(typeof data === 'string' ? data : data?.message || 'Login failed.');
            }
        } catch {
            setError('Network error. Is the backend running?');
        } finally { setLoading(false); }
    };

    const handleVerifyEmail = async (otp) => {
        setError(''); setLoading(true);
        try {
            const res = await fetch(`${API}/verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, otp }),
            });
            const { data } = await parseResponse(res);
            if (res.ok) {
                login(data.user, data.token);
                navigate('/dashboard');
            } else {
                setError(typeof data === 'string' ? data : data?.message || 'Verification failed.');
            }
        } catch {
            setError('Network error.');
        } finally { setLoading(false); }
    };

    const handleResend = async () => {
        if (cooldown > 0) return;
        setError(''); setInfo('');
        try {
            const res = await fetch(`${API}/resend-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, type: 'email_verification' }),
            });
            const { data } = await parseResponse(res);
            if (res.ok) { setInfo('New OTP sent! Check your email.'); startCooldown(); }
            else setError(typeof data === 'string' ? data : 'Failed to resend OTP.');
        } catch {
            setError('Network error.');
        }
    };

    const startCooldown = () => {
        setCooldown(60);
        const id = setInterval(() =>
            setCooldown(c => { if (c <= 1) { clearInterval(id); return 0; } return c - 1; }), 1000);
    };

    if (step === 'otp_verify_email') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl">
                            📧
                        </div>
                        <CardTitle>Verify Your Email</CardTitle>
                        <CardDescription>
                            {info || `Enter the 6-digit code sent to`} <strong className="text-foreground">{formData.email}</strong>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <div className="flex justify-center">
                            <OtpInput onComplete={handleVerifyEmail} disabled={loading} />
                        </div>
                        {loading && <p className="text-sm text-muted-foreground text-center">Verifying…</p>}
                        {error && <p className="text-sm font-medium text-destructive text-center">{error}</p>}
                        {!loading && !error && info && <p className="text-sm font-medium text-green-600 text-center">{info}</p>}
                    </CardContent>
                    <CardFooter className="flex gap-2">
                        <Button variant="outline" className="w-full" onClick={() => { setStep('form'); setError(''); setInfo(''); }}>
                            Back
                        </Button>
                        <Button variant="outline" className="w-full" onClick={handleResend} disabled={cooldown > 0}>
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
                    <CardTitle className="text-2xl">Login</CardTitle>
                    <CardDescription>
                        Enter your email below to login to your account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="grid gap-4">
                        {info && <div className="rounded-md bg-green-50 p-3 text-sm font-medium text-green-800">{info}</div>}
                        
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="m@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center">
                                <Label htmlFor="password">Password</Label>
                                <Link to="/forgot-password" className="ml-auto inline-block text-sm underline text-muted-foreground hover:text-primary">
                                    Forgot your password?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Logging in…' : 'Login'}
                        </Button>
                    </form>
                    <div className="mt-4 text-center text-sm">
                        Don&apos;t have an account?{" "}
                        <Link to="/signup" className="underline hover:text-primary">
                            Sign up
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default LoginForm;
