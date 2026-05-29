import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Gestock-Ferme title in header', () => {
  render(<App />);
  const titleElements = screen.getAllByText(/Gestock-Ferme/i);
  expect(titleElements.length).toBeGreaterThan(0);
});

test('renders Login form when not authenticated', () => {
  render(<App />);
  const loginTitle = screen.getByText(/Connexion/i);
  expect(loginTitle).toBeInTheDocument();
});
