import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { RangeFields } from './Toolbar';

it('applies valid years and prevents reversed or empty ranges', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<RangeFields from={1957} to={2026} bounds={[1957, 2026]} onChange={onChange} />);
  await user.clear(screen.getByLabelText('Start year'));
  await user.type(screen.getByLabelText('Start year'), '2000');
  await user.click(screen.getByRole('button', { name: 'Apply' }));
  expect(onChange).toHaveBeenCalledWith(2000, 2026);
  onChange.mockClear();
  await user.clear(screen.getByLabelText('End year'));
  await user.type(screen.getByLabelText('End year'), '1990');
  await user.click(screen.getByRole('button', { name: 'Apply' }));
  expect(screen.getByRole('alert')).toHaveTextContent('start no later than the end');
  expect(onChange).not.toHaveBeenCalled();
  await user.clear(screen.getByLabelText('End year'));
  await user.click(screen.getByRole('button', { name: 'Apply' }));
  expect(onChange).not.toHaveBeenCalled();
});
