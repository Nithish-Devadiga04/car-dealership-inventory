import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthPage, validateAuthForm } from './AuthPage';

const login = vi.fn();
const register = vi.fn();
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: null, login, register }) }));

const renderPage = (mode: 'login' | 'register') =>
  render(<MemoryRouter><AuthPage mode={mode} /></MemoryRouter>);

describe('validateAuthForm', () => {
  it('requires a valid email and a password on login', () => {
    expect(validateAuthForm('login', { name: '', email: 'nope', password: '' })).toEqual({
      email: 'Enter a valid email address',
      password: 'Password is required',
    });
  });
  it('enforces password strength and name on register', () => {
    const errors = validateAuthForm('register', { name: 'A', email: 'a@b.co', password: 'abcdefgh' });
    expect(errors.name).toBeDefined();
    expect(errors.password).toMatch(/letter and one number/);
  });
  it('accepts valid registration data', () => {
    expect(validateAuthForm('register', { name: 'Ada', email: 'ada@x.io', password: 'Secret123' })).toEqual({});
  });
});

describe('<AuthPage />', () => {
  beforeEach(() => vi.clearAllMocks());

  it('submits login credentials', async () => {
    login.mockResolvedValue(undefined);
    renderPage('login');
    await userEvent.type(screen.getByLabelText('Email'), 'a@b.co');
    await userEvent.type(screen.getByLabelText('Password'), 'Secret123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(login).toHaveBeenCalledWith('a@b.co', 'Secret123');
  });

  it('does not call the API when the form is invalid', async () => {
    renderPage('register');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(register).not.toHaveBeenCalled();
    expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
  });

  it('shows the API error message when login fails', async () => {
    login.mockRejectedValue(new Error('Invalid email or password'));
    renderPage('login');
    await userEvent.type(screen.getByLabelText('Email'), 'a@b.co');
    await userEvent.type(screen.getByLabelText('Password'), 'WrongPass1');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
  });
});
