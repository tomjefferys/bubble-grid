import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getTransform } from './transformbuilder';

interface Content {
    content : string[];
}

const NUM_COLS = 10;

// Debounce function to limit the rate at which a function can fire
const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

const Bubbles = ({ content } : Content) => {
    // Keep track of the scroll position to ensure the component re-renders when the user scrolls
    const [scrollPosition, setScrollPosition] = useState({ scrollTop: 0, scrollLeft: 0 });

    // State to track if the component has loaded, so we don't show the content before it's ready
    const [isLoaded, setIsLoaded] = useState(false);

    const [isDragging, setIsDragging] = useState(false);
    const [startMousePosition, setStartMousePosition] = useState({ x: 0, y: 0 });

    // Refs to store the container and the outer divs
    // The outer divs are not scaled or translated so can be relied on to get the correct size and location
    const containerRef = useRef<HTMLDivElement>(null);
    const outerDivs = useRef<DOMRect[][]>([]);

    const handleScroll = () => {
        if (containerRef.current) {
            // Ensure scrolling triggers a re-render
            setScrollPosition({
                scrollTop: containerRef.current.scrollTop,
                scrollLeft: containerRef.current.scrollLeft,
            });
        }
    };

    const debouncedHandleScroll = useCallback(debounce(handleScroll, 1000/60), []);

    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.addEventListener('scroll', debouncedHandleScroll);
            return () => {
                container.removeEventListener('scroll', debouncedHandleScroll);
            };
        }
    }, [debouncedHandleScroll]);

    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            // Set the initial scroll position to 50%
            container.scrollTop = container.scrollHeight / 2;
            container.scrollLeft = container.scrollWidth / 2;
            setScrollPosition({
                scrollTop: container.scrollTop,
                scrollLeft: container.scrollLeft,
            });
        }
    }, []);


    // Split the words into rows
    const rows = [];
    for (let i = 0; i < content.length; i += NUM_COLS) {
        rows.push(content.slice(i, i + NUM_COLS));
    }

    const setOuterDivRef = (el: HTMLDivElement | null, row: number, column : number) => {
        if (el) {
            if (!outerDivs.current[row]) {
                outerDivs.current[row] = [];
            }
            outerDivs.current[row][column] = el.getBoundingClientRect();
        }
    };

    useEffect(() => {
        setIsLoaded(true);
    }, [rows, scrollPosition]);

    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        setIsDragging(true);
        setStartMousePosition({ x: event.clientX, y: event.clientY });
    };

    const handleMouseMove = (event: MouseEvent) => {
        if (isDragging && containerRef.current) {
            const dx = event.clientX - startMousePosition.x;
            const dy = event.clientY - startMousePosition.y;
            containerRef.current.scrollLeft -= dx;
            containerRef.current.scrollTop -= dy;
            setStartMousePosition({ x: event.clientX, y: event.clientY });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    const calculateTransform = (rowIndex: number, index: number) : string => {
        if (!outerDivs.current || !outerDivs.current[rowIndex] || !outerDivs.current[rowIndex][index] || !containerRef.current) {
            return '';
        }
        const containerRect = containerRef.current.getBoundingClientRect();
        const cellRect = outerDivs.current[rowIndex][index];
        return getTransform(containerRect, cellRect);
    }

    return (
        <div 
            ref={containerRef}
            onMouseDown={handleMouseDown}
            style={{ 
                width: '90vw',
                maxWidth: '90vw',
                height: '25vh',
                position: 'relative',
                overflowX: 'auto',
                overflowY: 'auto',
                display: 'grid',
                padding: '5vh 15vw',
                border: '1px solid white',
                boxSizing: 'border-box',
                cursor: isDragging ? 'grabbing' : 'grab', // Change cursor during dragging
            }}>
            {rows.map((row, rowIndex) => (
                <div key={rowIndex} 
                     style={{ 
                        display: 'grid', 
                        //gridTemplateColumns: `repeat(${NUM_COLS}, minmax(100px, 1fr))`,
                        gridTemplateColumns: `repeat(${NUM_COLS}, minmax(auto, 100px))`,
                        marginLeft: rowIndex % 2 === 1 && outerDivs.current[rowIndex]
                            ? `${outerDivs.current[rowIndex][0]?.width / 2}px`
                        : '0',
                        marginRight: rowIndex % 2 === 0 && outerDivs.current[rowIndex]
                            ? `${outerDivs.current[rowIndex][0]?.width / 2}px`
                        : '0',
                        willChange: 'transform',
                        visibility: isLoaded ? 'visible' : 'hidden',
                        }}>

                    {row.map((item, index) => (
                        <div key = {item + "_outer"}
                             ref = {(el) => setOuterDivRef(el, rowIndex, index)}>
                            <div
                                key={item} 
                                style={{
                                    border: '1px solid white',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',  
                                    padding: '10px',
                                    margin: '1px',
                                    position: 'relative',
                                    willChange: 'transform',
                                    borderRadius: '50%',
                                    overflow: 'hidden', // Clip content inside the div
                                    boxShadow: '0 0 5px rgba(0, 0, 0, 0.2)', // Add subtle shadow
                                    maxWidth: '200px',
                                    minWidth: '100px',
                                    transformOrigin: 'center',
                                }}
                                data-foo="bar"
                                ref={(el) => {
                                    if (el) {
                                        const transform = calculateTransform(rowIndex, index);
                                        el.style.transform = transform;
                                    }
                                }}
                            >
                                {item}
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default Bubbles;