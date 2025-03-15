import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Content {
    content : string[];
}

const NUM_COLS = 6;

// Debounce function to limit the rate at which a function can fire
const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

const Bubbles = ({ content } : Content) => {
    const [positions, setPositions] = useState<{ [key: string]: { x: number; y: number } }>({});
    const [scrollPosition, setScrollPosition] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const rowRefs = useRef<HTMLDivElement[]>([]);
    const originalSizes = useRef<{ [key: string]: { width: number; height: number } }>({});


    //const handleDragStart = (event: React.DragEvent<HTMLDivElement>, item: string) => {
    //    event.dataTransfer.setData('text/plain', item);
    //};

    //const handleDragEnd = (event: React.DragEvent<HTMLDivElement>, item: string) => {
    //    const newPositions = { ...positions };
    //    newPositions[item] = {
    //        x: event.clientX - event.currentTarget.offsetWidth / 2,
    //        y: event.clientY - event.currentTarget.offsetHeight / 2,
    //    };
    //    setPositions(newPositions);
    //};

    const handleScroll = () => {
        if (containerRef.current) {
            setScrollPosition(containerRef.current.scrollTop);
        }
    };

    const debouncedHandleScroll = useCallback(debounce(handleScroll, 1000/60), []);

    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            //container.addEventListener('scroll', handleScroll);
            container.addEventListener('scroll', debouncedHandleScroll);
            return () => {
                //container.removeEventListener('scroll', handleScroll);
                container.removeEventListener('scroll', debouncedHandleScroll);
            };
        }
    }, [debouncedHandleScroll]);

    const getScale = (element: HTMLDivElement) => {
        const container = containerRef.current;
        if (!container) return 1;
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();

        // Calculate the vertical scale
        const elementVerticalCenter = elementRect.top + elementRect.height / 2;
        const relativeVerticalPosition = elementVerticalCenter - containerRect.top;
        const proportionalVerticalPosition = relativeVerticalPosition / containerRect.height;
        let verticalScale = 1;
        if (proportionalVerticalPosition < 0.25) {
            const shrinkArea = 0.25 * containerRect.height;
            verticalScale = relativeVerticalPosition / shrinkArea;
        } else if (proportionalVerticalPosition > 0.75) {
            const shrinkArea = 0.25 * containerRect.height;
            verticalScale = (containerRect.height - relativeVerticalPosition) / shrinkArea;
        }
        verticalScale = Math.max(0, verticalScale);

        //Calculate the horizontal scale
        const elementHorizontalCenter = elementRect.left + elementRect.width / 2;
        const relativeHorizontalPosition = elementHorizontalCenter - containerRect.left;
        const proportionalHorizontalPosition = relativeHorizontalPosition / containerRect.width;
        let horizontalScale = 1;
        if (proportionalHorizontalPosition < 0.25) {
            const shrinkArea = 0.25 * containerRect.width;
            horizontalScale = relativeHorizontalPosition / shrinkArea;
        } else if (proportionalHorizontalPosition > 0.75) {
            const shrinkArea = 0.25 * containerRect.width;
            horizontalScale = (containerRect.width - relativeHorizontalPosition) / shrinkArea;
        }
        horizontalScale = Math.min(1, horizontalScale);

        return verticalScale * horizontalScale;

        //const scale = 1 + (relativePosition / containerRect.height);
        //return scale;
    };

    // Split the words into rows
    const rows = [];
    for (let i = 0; i < content.length; i += NUM_COLS) {
        rows.push(content.slice(i, i + NUM_COLS));
    }

    const setRowRef = useCallback((el: HTMLDivElement | null, index: number) => {
        if (el) {
            rowRefs.current[index] = el;
        }
    }, []);

    const setItemRef = useCallback((el: HTMLDivElement | null, item: string) => {
        if (el && !originalSizes.current[item]) {
            originalSizes.current[item] = {
                width: el.getBoundingClientRect().width,
                height: el.getBoundingClientRect().height,
            };
        }
    }, []);

    useEffect(() => {
        // Apply scaling to each item after the component mounts
        rowRefs.current.forEach((row) => {
            if (row) {
                Array.from(row.children).forEach((child) => {
                    const el = child as HTMLDivElement;
                    el.style.transform = `scale(${getScale(el)})`;
                });
            }
        });
    }, [rows]);

    return (
        <div 
            ref={containerRef}
            style={{ 
                width: '75vw',
                height: '25vh',
                position: 'relative',
                overflow: 'auto',
                display: 'grid',
                padding: '100px 10px 10px 10px',
                border: '1px solid white'}}>
            {rows.map((row, rowIndex) => (
                <div key={rowIndex} 
                     ref={(el) => setRowRef(el, rowIndex)}
                     style={{ 
                        display: 'grid', 
                        gridTemplateColumns: `repeat(${NUM_COLS}, minmax(100px, 1fr))`,
                        justifyContent: 'center',
                        marginLeft: rowIndex % 2 === 1 && rowRefs.current[rowIndex]
                            ? `${originalSizes.current[row[0]]?.width / 2}px`
                        : '0',
                        marginRight: rowIndex % 2 === 0 && rowRefs.current[rowIndex]
                            ? `${originalSizes.current[row[0]]?.width / 2}px`
                        : '0',
                        willChange: 'transform',
                        }}>

                    {row.map((item, index) => (
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
                                //transform: 'translateZ(0)', // Trigger hardware acceleration
                            }}
                            ref={(el) => {
                                setItemRef(el, item);
                                if (el) {
                                    el.style.transform = `scale(${getScale(el)})`;
                                }
                            }}
                        >
                            {item}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default Bubbles;