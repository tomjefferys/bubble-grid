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
interface Dimension {
    x: number;
    y: number;
}

const NUM_COLS = 10;

const CONTAINER_HEIGHT_MULTIPLIER = 1.25;
const CONTAINER_WIDTH_MULTIPLIER = 1.25;

// Debounce function to limit the rate at which a function can fire
const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

const Bubbles = ({ content } : Content) => {
    const [scrollPosition, setScrollPosition] = useState({ scrollTop: 0, scrollLeft: 0 });
    const [isLoaded, setIsLoaded] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [startMousePosition, setStartMousePosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const rowRefs = useRef<HTMLDivElement[]>([]);
    const outerDivs = useRef<DOMRect[][]>([]);
    const items = useRef<HTMLDivElement[][]>([]);

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

    const getRatioFromCentre = (row : number, column : number) : Dimension => {
        const container = containerRef.current;
        if (!container) return { x: 0, y: 0 };
        const containerRect = container.getBoundingClientRect();

        const outerDivRect = outerDivs.current[row][column];

        // Get the centre of the container and the element
        const containerCentre = {
            x: containerRect.left + containerRect.width / 2,
            y: containerRect.top + containerRect.height / 2,
        };
        const elementCentre = {
            x: outerDivRect.left + outerDivRect.width / 2,    
            y: outerDivRect.top + outerDivRect.height / 2,
        };

        // Increase the height of the container, so elements off the top and bottom are scaled and potentially shown
        const height = containerRect.height * CONTAINER_HEIGHT_MULTIPLIER;

        // Calculate the vertical scale based on the distance from the centre of the container
        const verticalDistance = containerCentre.y - elementCentre.y;
        const y = verticalDistance / (height / 2);


        const width = containerRect.width * CONTAINER_WIDTH_MULTIPLIER;

        const horizontalDistance = containerCentre.x - elementCentre.x;
        const x = horizontalDistance / (width / 2);
        return { x, y: y };
    }


    const getScale = (ratioFromCentre: Dimension) : Scale => {
        const container = containerRef.current;
        if (!container) return {verticalScale: 1, horizontalScale: 1};

        const SHRINK_AREA = 0.5;  // The area where the element will shrink, defined as a fraction the distance from the centre.

        const { x, y } = ratioFromCentre; 
        let verticalScale = 1;
        if(Math.abs(y) > (1 - SHRINK_AREA)) {
            const dY = Math.abs(y) - (1 - SHRINK_AREA);
            verticalScale = 1 - dY / SHRINK_AREA;
        }
        verticalScale = Math.max(0, verticalScale);

        let horizontalScale = 1;
        if (Math.abs(x) > (1 - SHRINK_AREA)) {
            const dX = Math.abs(x) - (1 - SHRINK_AREA);
            horizontalScale = 1 - dX / SHRINK_AREA;
        }
        horizontalScale = Math.max(0, horizontalScale);
        return {verticalScale, horizontalScale};
    };

    const getTranslation = (centreDelta: Dimension, scale : Scale, row : number, column : number) 
        : { t : Translation, debugStr : string } => {

        if (!outerDivs.current || !outerDivs.current[row] || !outerDivs.current[row][column]) {
            return { t: { x: 0, y: 0 }, debugStr: "" };
        }

        const originalRect = outerDivs.current[row][column];
        //const originalSize = originalSizes.current[item];

        // Calculate the translation based on the scale
        const MARGIN_SIZE = 2;
        const height = originalRect.height + MARGIN_SIZE;
        const width = originalRect.width + MARGIN_SIZE;

        const translateYFraction = 1 - scale.verticalScale;
        const translateYMagnitude = (height * translateYFraction) / 2;
        let y = (Math.sign(centreDelta.y)) * translateYMagnitude;

        const translateXFraction = 1 - scale.horizontalScale;
        const translateXMagnitude = (width * translateXFraction) / 2;
        let x = (Math.sign(centreDelta.x)) * translateXMagnitude;
        
        let debugStr = "";
        const container = containerRef.current;
        if (container) {
            // Calculate the vertical translation to keep elements in adjacent rows close
            const containerRect = container.getBoundingClientRect();

            // Calculate the difference between the spacing of the rows and the optimal spacing.
            const hRadius = height / 2;
            const optimalVerticalDistance = Math.sqrt(3) * hRadius;

            // Optimal vertical disatance (oval calculation) is coming out at 63 vs 43 for the height
            const verticalAdjustment = height - optimalVerticalDistance;
            if (Math.abs(centreDelta.y) < 2) {
                const distanceFormCentre = centreDelta.y * (containerRect.height/2);
                const adjustmentRatio = distanceFormCentre / height;
                const dy = adjustmentRatio * verticalAdjustment;
                y += dy;
            }
        }

        // Calculate additional translation to handle contiguous rows/columns being scaled
        // If the centre + height is outside the shrink area then both this element, and the next closest
        // to the center wil be scaled, so we need to adjust the translation further
        
        // How many widths past the scaling boundry are we?
        // Calculate width as a fraction of the container size
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (containerRect) {
            const SHRINK_AREA = 0.5;
            const widthRatio = (width / ((containerRect.width / 2) * CONTAINER_WIDTH_MULTIPLIER));  // Divide by 2 as comparing this to the distance from the centre
            const dxFromShrinkArea = Math.abs(centreDelta.x) - (1 - SHRINK_AREA);
            if (dxFromShrinkArea > 0) {
                const widthsFromShrinkArea = dxFromShrinkArea / widthRatio;
                if (widthsFromShrinkArea > 1) {
                    // Need to increase the translation to cope with double shrinkage
                    x += x * (widthsFromShrinkArea - 1);
                }
            }

            const heightRatio = (height / ((containerRect.height / 2) * CONTAINER_HEIGHT_MULTIPLIER));
            const dyFromShrinkArea = Math.abs(centreDelta.y) - (1 - SHRINK_AREA);
            if (dyFromShrinkArea > 0) {
                const heightsFromShrinkArea = dyFromShrinkArea / heightRatio;
                if (heightsFromShrinkArea > 1) {
                    // Need to increase the translation to cope with double shrinkage
                    y += y * (heightsFromShrinkArea - 1);
                }
            }

        }


        return { t: {x, y }, debugStr };
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

    const setOuterDivRef = useCallback((el: HTMLDivElement | null, row: number, column : number) => {
        if (el) {
            if (!outerDivs.current[row]) {
                outerDivs.current[row] = [];
            }
            outerDivs.current[row][column] = el.getBoundingClientRect();
        }
    }
    , []);

    const setItemRef = useCallback((el: HTMLDivElement | null, item: string, row : number, column : number) => {
        if (el) {
            if (!items.current[row]) {
                items.current[row] = [];
            }
            items.current[row][column] = el;
        } }, []);

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
                     ref={(el) => setRowRef(el, rowIndex)}
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
                                }}
                                data-foo="bar"
                                ref={(el) => {
                                    setItemRef(el, item, rowIndex, index);
                                    if (el) {
                                        const centreDelta = getRatioFromCentre(rowIndex, index);
                                        const {verticalScale, horizontalScale} = getScale(centreDelta);  
                                        const scale = verticalScale * horizontalScale;
                                        const {t, debugStr} = getTranslation(centreDelta, {horizontalScale, verticalScale}, rowIndex, index);
                                        const {x, y} = t;
                                        // Translate must come before scale, or the translation amounts will be scaled
                                        el.style.transform = `translateZ(0) translate(${x}px, ${y}px) scale(${scale}) `;
                                        el.style.transformOrigin = 'center';
                                        //el.ariaLabel = debugStr;
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