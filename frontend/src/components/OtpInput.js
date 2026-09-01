import React, { useRef, useState } from 'react';
import { cn } from '../lib/utils';

/**
 * OtpInput — renders N individual digit boxes.
 * Auto-advances focus, handles backspace, supports paste.
 *
 * Props:
 *   length     {number}   — number of digits (default 6)
 *   onComplete {function} — called with the full OTP string when all boxes are filled
 *   disabled   {boolean}  — disable all inputs while verifying
 */
function OtpInput({ length = 6, onComplete, disabled = false }) {
    const [digits, setDigits] = useState(new Array(length).fill(''));
    const refs = useRef([]);

    const updateDigits = (newDigits) => {
        setDigits(newDigits);
        const full = newDigits.join('');
        if (full.length === length && !newDigits.includes('')) {
            onComplete(full);
        }
    };

    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) return; // digits only
        const next = [...digits];
        next[index] = value.slice(-1);    // keep last char if 2 digits typed
        updateDigits(next);

        // Auto-advance
        if (value && index < length - 1) refs.current[index + 1]?.focus();
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace') {
            if (digits[index]) {
                // Clear current box
                const next = [...digits];
                next[index] = '';
                setDigits(next);
            } else if (index > 0) {
                // Move back if already empty
                refs.current[index - 1]?.focus();
            }
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
        if (!pasted) return;
        const next = new Array(length).fill('');
        pasted.split('').forEach((ch, i) => { next[i] = ch; });
        updateDigits(next);
        // Focus last filled box or last box
        const focusIndex = Math.min(pasted.length, length - 1);
        refs.current[focusIndex]?.focus();
    };

    return (
        <div className="flex justify-center gap-2 my-4">
            {digits.map((digit, i) => (
                <input
                    key={i}
                    ref={el => refs.current[i] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    disabled={disabled}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    onFocus={e => e.target.select()}
                    className={cn(
                        "flex h-14 w-12 text-center text-2xl font-semibold rounded-md border bg-background transition-all focus-visible:outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
                        digit ? "border-primary" : "border-input"
                    )}
                />
            ))}
        </div>
    );
}

export default OtpInput;
