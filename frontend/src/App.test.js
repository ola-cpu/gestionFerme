import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Gestock-Ferme title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Gestock-Ferme/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders Élevage module', () => {
  render(<App />);
  const moduleElement = screen.getByText(/Élevage/i);
  expect(moduleElement).toBeInTheDocument();
});
