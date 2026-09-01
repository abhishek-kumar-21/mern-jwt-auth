import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

function SignupForm() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [step, setStep]       = useState('form');
    const [formData, setFormData] = useState({ firstName: '', lastName: '', username: '', email: '', password: '' });
    const [userId, setUserId]   = useState(null);
    const [error, setError]     = useState('');
    const [info, setInfo]       = useState('');
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    const handleChange = (e) =>
        setFormData(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleSignup = async (e) => {
        e.preventDefault();
        setError(''); setInfo(''); setLoading(true);
        try {
            const res = await fetch(`${API}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const { data } = await parseResponse(res);
            if (res.ok) {
                setUserId(data.userId);
                setInfo(data.message);
                setStep('otp');
                startCooldown();
            } else {
                setError(typeof data === 'string' ? data : data?.message || 'Signup failed.');
            }
        } catch {
            setError('Network error. Is the backend running?');
        } finally { setLoading(false); }
    };

    const handleVerifyOtp = async (otp) => {
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
            setError('Network error. Please try again.');
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

    if (step === 'otp') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl">
                            📧
                        </div>
                        <CardTitle>Verify Your Email</CardTitle>
                        <CardDescription>
                            We sent a 6-digit code to <strong className="text-foreground">{formData.email}</strong>.<br />
                            Enter it below to activate your account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <div className="flex justify-center">
                            <OtpInput onComplete={handleVerifyOtp} disabled={loading} />
                        </div>
                        {loading && <p className="text-sm text-muted-foreground text-center">Verifying…</p>}
                        {error && <p className="text-sm font-medium text-destructive text-center">{error}</p>}
                        {info && !error && !loading && <p className="text-sm font-medium text-green-600 text-center">{info}</p>}
                    </CardContent>
                    <CardFooter>
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
                    <CardTitle className="text-2xl">Create an account</CardTitle>
                    <CardDescription>
                        Enter your information to get started.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSignup} className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="firstName">First name</Label>
                                <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="lastName">Last name</Label>
                                <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="username">Username</Label>
                            <Input id="username" name="username" value={formData.username} onChange={handleChange} required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="m@example.com" value={formData.email} onChange={handleChange} required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required />
                        </div>
                        
                        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Creating account…' : 'Sign up'}
                        </Button>
                    </form>
                    <div className="mt-4 text-center text-sm">
                        Already have an account?{" "}
                        <Link to="/login" className="underline hover:text-primary">
                            Log in
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default SignupForm;
