import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Content {
    content : string[];
}

const NUM_COLS = 6;

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

    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => {
                container.removeEventListener('scroll', handleScroll);
            };
        }
    }, []);

    const getScale = (element: HTMLDivElement) => {
        const container = containerRef.current;
        if (!container) return 1;
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const elementCenter = elementRect.top + elementRect.height / 2;
        const relativePosition = elementCenter - containerRect.top;
        const proportionalPosition = relativePosition / containerRect.height;
        if (proportionalPosition < 0.25) {
            const shrinkArea = 0.25 * containerRect.height;
            const shrink = relativePosition / shrinkArea;
            return shrink;
        } else if (proportionalPosition > 0.75) {
            const shrinkArea = 0.25 * containerRect.height;
            const shrink = (containerRect.height - relativePosition) / shrinkArea;
            return shrink;
        }
        return 1;

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