import { useState } from 'react';

/**
 * Simple, accessible OTP entry field. Accepts paste, limits to digits and a
 * fixed length. The real validation happens server-side.
 */
export default function OtpInput({ value = '', onChange, length = 6, label = 'Verification code' }) {
  const [focused, setFocused] = useState(false);

  const handleChange = (e) => {
    const next = String(e.target.value || '')
      .replace(/\D/g, '')
      .slice(0, length);
    onChange(next);
  };

  const handlePaste = (e) => {
    const pasted = (e.clipboardData || e.originalEvent.clipboardData).getData('text');
    const digits = pasted.replace(/\D/g, '').slice(0, length);
    if (digits) {
      e.preventDefault();
      onChange(digits);
    }
  };

  return (
    <div className="otp-field">
      <label htmlFor="otp-input">{label}</label>
            <input
        id="otp-input"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        maxLength={length}
        value={value}
        onChange={handleChange}
        onPaste={handlePaste}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={focused ? 'focused' : ''}
        placeholder={'\u2022'.repeat(length)}
      />
    </div>
  );
}

