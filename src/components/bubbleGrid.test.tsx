import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Bubbles from './bubbleGrid';
import * as Rect from '../util/rect';

describe('Bubbles Component', () => {
    const items = Array.from({ length: 20 }, (_, i) => {
         const item = (<div key={i} data-testid={`bubble-${i}`}>
            Bubble {i + 1}
        </div>)
        return { item };
    });

    const mockContent = Rect.createRect(items, 10); // Assuming 10 columns

    test('renders the bubbles correctly', () => {
        render(<Bubbles content={mockContent} />);

        // Check if all bubbles are rendered
        mockContent.forEach((_, i) => {
            expect(screen.getByTestId(`bubble-${i}`)).toBeInTheDocument();
        });
    });

    test('handles mouse down and drag events', () => {
        render(<Bubbles content={mockContent} />);

        const container = screen.getByRole('grid'); // Assuming the container is a grid

        const startScrollTop = container.scrollTop;       
        const startScrollLeft = container.scrollLeft;

        // Simulate mouse down
        fireEvent.mouseDown(container, { clientX: 100, clientY: 100 });

        // Simulate mouse move
        fireEvent.mouseMove(container, { clientX: 150, clientY: 150 });

        // Simulate mouse up
        fireEvent.mouseUp(container);

        // Check if the scroll position has changed
        expect(container.scrollTop).not.toBeLessThan(startScrollTop);
        expect(container.scrollLeft).not.toBeLessThan(startScrollLeft);
    });

    test("Click propagations should happen unless dragging", () => {
        const handleClick = jest.fn();
        render(
            <div onClick={handleClick}>
                <Bubbles content={mockContent} />
            </div>
        );
        const container = screen.getByRole('grid'); // Assuming the container is a grid

        fireEvent.click(container);
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('prevents click propagation after dragging', () => {
        const handleClick = jest.fn();
        render(
            <div onClick={handleClick}>
                <Bubbles content={mockContent} />
            </div>
        );

        const container = screen.getByRole('grid'); // Assuming the container is a grid

        // Simulate mouse down, move, and up to trigger dragging
        fireEvent.mouseDown(container, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(container, { clientX: 150, clientY: 150 });
        fireEvent.mouseUp(container);

        // Simulate a click event
        fireEvent.click(container);

        // Ensure the click event was not propagated
        expect(handleClick).not.toHaveBeenCalled();

        // The next click should be allowed
        fireEvent.mouseDown(container, { clientX: 100, clientY: 100 });
        fireEvent.mouseUp(container);
        fireEvent.click(container);

        expect(handleClick).toHaveBeenCalledTimes(1);
    });
});