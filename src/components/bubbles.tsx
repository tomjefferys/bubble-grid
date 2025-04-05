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
    const [isDragging, setIsDragging] = useState(false);
    const [startMousePosition, setStartMousePosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const rowRefs = useRef<HTMLDivElement[]>([]);
    const outerDivs = useRef<HTMLDivElement[][]>([]);
    const originalSizes = useRef<{ [key: string]: { width: number; height: number } }>({});
    const items = useRef<HTMLDivElement[][]>([]);

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

    const getRatioFromCentre = (element: HTMLDivElement, row : number, column : number) : Dimension => {
        const container = containerRef.current;
        if (!container) return { x: 0, y: 0 };
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const rowElement = rowRefs.current[row];
        const rowRect = rowElement.getBoundingClientRect();

        const outerDiv = outerDivs.current[row][column];
        const outerDivRect = outerDiv.getBoundingClientRect();

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
        const heightMultiplier = 1.25;
        const height = containerRect.height * heightMultiplier;

        // Calculate the vertical scale based on the distance from the centre of the container
        const verticalDistance = containerCentre.y - elementCentre.y;
        const y = verticalDistance / (height / 2);

        const horizontalDistance = containerCentre.x - elementCentre.x;
        const x = horizontalDistance / (containerRect.width / 2);
        return { x, y: y };
    }


    const getScale = (element: HTMLDivElement, ratioFromCentre: Dimension) : Scale => {
        const container = containerRef.current;
        if (!container) return {verticalScale: 1, horizontalScale: 1};
        //const containerRect = container.getBoundingClientRect();
        //const elementRect = element.getBoundingClientRect();

        const SHRINK_AREA = 0.5;  // The area where the element will shrink, defined as a fraction the distance from the centre.

        const { x, y } = ratioFromCentre; //getRatioFromCentre(element, row);
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

    const getTranslation = (element: HTMLDivElement, centreDelta: Dimension, scale : Scale, item: string) 
        : { t : Translation, debugStr : string } => {
        const originalSize = originalSizes.current[item];

        const MARGIN_SIZE = 2;
        const height = originalSize.height + MARGIN_SIZE;
        const width = originalSize.width + MARGIN_SIZE;

        const translateYFraction = 1 - scale.verticalScale;
        const translateYMagnitude = (height * translateYFraction) / 2;
        let y = (Math.sign(centreDelta.y)) * translateYMagnitude;

        const translateXFraction = 1 - scale.horizontalScale;
        const translateXMagnitude = (originalSize.width * translateXFraction) / 2;
        const x = (Math.sign(centreDelta.x)) * translateXMagnitude;
        
        let debugStr = "";
        const container = containerRef.current;
        if (container) {
            const containerRect = container.getBoundingClientRect();
            // Calculate the difference between the spacing of the rows and the optimal spacing.
            // TODO because the object are ovals, the radius isn't height / 2
            const radius = (height + width) / 4;
            const hRadius = height / 2;
            const wRadius = width / 2;
            const optimalVerticalDistance = Math.sqrt(3) * hRadius;
            //const optimalVerticalDistance = Math.sqrt((4*(radius * radius)) - (wRadius * wRadius))
            // Optimal vertical disatance (oval calculation) is coming out at 63 vs 43 for the height
            const verticalAdjustment = height - optimalVerticalDistance;
            if (Math.abs(centreDelta.y) < 2) {

                // This isn't quite right, the distance is too wide, although the scrolling is smooth
                const distanceFormCentre = centreDelta.y * (containerRect.height/2);
                const adjustmentRatio = distanceFormCentre / height;

                const dy = adjustmentRatio * verticalAdjustment;

                y += dy;

                debugStr += `dy: ${dy}, 
                                y: ${y}, 
                                cd.y: ${centreDelta.y}, 
                                adj: ${adjustmentRatio}, 
                                dist: ${distanceFormCentre}, 
                                opt: ${optimalVerticalDistance}`;

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
            outerDivs.current[row][column] = el;
        }
    }
    , []);

    const setItemRef = useCallback((el: HTMLDivElement | null, item: string, row : number, column : number) => {
        if (el) {
            if (!items.current[row]) {
                items.current[row] = [];
            }
            items.current[row][column] = el;
            if (!originalSizes.current[item]) {
                originalSizes.current[item] = {
                    width: el.getBoundingClientRect().width,
                    height: el.getBoundingClientRect().height,
                };
            }
        } }, []);

    useEffect(() => {
        // Apply scaling to each item after the component mounts
        //rowRefs.current.forEach((row) => {
        //    if (row) {
        //        Array.from(row.children).forEach((child) => {
        //            const el = child as HTMLDivElement;
        //            const centreDelta = getRatioFromCentre(el);
        //            const { verticalScale, horizontalScale } = getScale(el, centreDelta);
        //            const scale = verticalScale * horizontalScale;
        //            const { x, y } = getTranslation(el, centreDelta, { horizontalScale, verticalScale }, el.dataset.foo || '');
        //            el.style.transform = `scale(${scale}) translate(${x}px, ${y}px)`;
        //        });
        //    }
        //});
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
                //padding: '100px 20px 100px 20px',
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
                                        const centreDelta = getRatioFromCentre(el, rowIndex, index);
                                        const {verticalScale, horizontalScale} = getScale(el, centreDelta);  
                                        const scale = verticalScale * horizontalScale;
                                        const {t, debugStr} = getTranslation(el, centreDelta, {horizontalScale, verticalScale}, item);
                                        const {x, y} = t;
                                        const boundingRect = el.getBoundingClientRect();
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