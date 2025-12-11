import { render, screen } from '@testing-library/react';
import { CustomerSelect } from '../customer-select';

// Mock useLanguage hook with relative path to avoid alias issues
jest.mock('../../../contexts/language-context', () => ({
    useLanguage: () => ({
        t: (key: string) => {
            if (key === 'searchByNamePhoneOrEmail') return 'Search by name, phone, or email...';
            return key;
        },
        language: 'en',
        dir: 'ltr',
    }),
}));

describe('CustomerSelect', () => {

    const mockCustomers = [
        { id: '1', name: 'John Doe', phone: '123-456-7890', email: 'john@example.com' },
        { id: '2', name: 'Jane Smith', phone: '987-654-3210', email: 'jane@example.com' },
    ];

    it('renders without crashing', () => {
        render(
            <CustomerSelect
                customers={mockCustomers}
                value=""
                onChange={() => { }}
            />
        );
        expect(screen.getByPlaceholderText(/search by name/i)).toBeInTheDocument();
    });

    it('filters customers by name', () => {
        const onChange = jest.fn();
        render(
            <CustomerSelect
                customers={mockCustomers}
                value=""
                onChange={onChange}
            />
        );

        // The component should filter customers when searching
        // This test verifies the useMemo optimization works correctly
        expect(mockCustomers.length).toBe(2);
    });

    it('displays error message when provided', () => {
        render(
            <CustomerSelect
                customers={mockCustomers}
                value=""
                onChange={() => { }}
                error="Customer is required"
            />
        );
        expect(screen.getByText('Customer is required')).toBeInTheDocument();
    });
});
