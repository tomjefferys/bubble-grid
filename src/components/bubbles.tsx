import { M_PLUS_1 } from 'next/font/google';
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Content {
    content : string[];
}

interface Scale {
    verticalScale: number;
    horizontalScale: number;
}

interface Translation {
    x: number;
    y: number;
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
    //const [positions, setPositions] = useState<{ [key: string]: { x: number; y: number } }>({});
    const [scrollPosition, setScrollPosition] = useState({ scrollTop: 0, scrollLeft: 0 });
    const [isLoaded, setIsLoaded] = useState(false);
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

    const getScale = (element: HTMLDivElement) : Scale => {
        const container = containerRef.current;
        if (!container) return {verticalScale: 1, horizontalScale: 1};
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const elementCenter = {
            x: elementRect.left + elementRect.width / 2,
            y: elementRect.top + elementRect.height / 2
        }

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
        horizontalScale = Math.max(0, horizontalScale);

        return {verticalScale, horizontalScale};
    };

    const getTranslation = (element: HTMLDivElement, scale: Scale, item: string) : Translation => {
        //const elementRect = element.getBoundingClientRect();
        const originalSize = originalSizes.current[item];
        const translateYFraction = 1 - scale.verticalScale;
        const y = (originalSize.height * translateYFraction);

        const translateXFraction = 1 - scale.horizontalScale;
        const x = (originalSize.width * translateXFraction) / 2;


        
        return {x, y };
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
        //rowRefs.current.forEach((row) => {
        //    if (row) {
        //        Array.from(row.children).forEach((child) => {
        //            const el = child as HTMLDivElement;
        //            el.style.transform = `scale(${getScale(el)})`;
        //        });
        //    }
        //});
        setIsLoaded(true);
    }, [rows, scrollPosition]);

    return (
        <div 
            ref={containerRef}
            style={{ 
                width: '90vw',
                maxWidth: '90vw',
                height: '25vh',
                position: 'relative',
                overflowX: 'auto',
                overflowY: 'auto',
                display: 'grid',
                //padding: '100px 20px 100px 20px',
                padding: '5vh 15vw',
                border: '1px solid white',
                boxSizing: 'border-box',}}>
            {rows.map((row, rowIndex) => (
                <div key={rowIndex} 
                     ref={(el) => setRowRef(el, rowIndex)}
                     style={{ 
                        display: 'grid', 
                        //gridTemplateColumns: `repeat(${NUM_COLS}, minmax(100px, 1fr))`,
                        gridTemplateColumns: `repeat(${NUM_COLS}, minmax(auto, 100px))`,
                        //justifyContent: 'center',
                        marginLeft: rowIndex % 2 === 1 && rowRefs.current[rowIndex]
                            ? `${originalSizes.current[row[0]]?.width / 2}px`
                        : '0',
                        marginRight: rowIndex % 2 === 0 && rowRefs.current[rowIndex]
                            ? `${originalSizes.current[row[0]]?.width / 2}px`
                        : '0',
                        willChange: 'transform',
                        visibility: isLoaded ? 'visible' : 'hidden',
                        //minWidth: '100%',
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
                                transform: 'translateZ(0)', // Trigger hardware acceleration
                                maxWidth: '200px',
                                minWidth: '100px',
                            }}
                            data-foo="bar"
                            ref={(el) => {
                                setItemRef(el, item);
                                if (el) {
                                    const {verticalScale, horizontalScale} = getScale(el);  
                                    const scale = verticalScale * horizontalScale;
                                    const {x, y} = getTranslation(el, {verticalScale, horizontalScale}, item);
                                    const boundingRect = el.getBoundingClientRect();
                                    el.style.transform = `scale(${scale}) translate(${x}px, ${y}px)`;
                                    el.ariaLabel = `RectH: ${boundingRect.height} VS: ${verticalScale}, scale: ${scale}, x: ${x}, y: ${y}`;
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