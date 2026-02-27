import { useRef, useState, useEffect, useCallback } from 'react';

/**
 * Componente de Virtual Scrolling para listas grandes
 * Renderiza apenas os itens visíveis na tela
 */
export default function VirtualList({
    items,
    itemHeight = 60,
    overscan = 5,
    renderItem,
    className = '',
    emptyMessage = 'Nenhum item encontrado',
}) {
    const containerRef = useRef(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);

    // Calcular itens visíveis
    const totalHeight = items.length * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
        items.length,
        Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    const visibleItems = items.slice(startIndex, endIndex);
    const offsetY = startIndex * itemHeight;

    // Handler de scroll otimizado
    const handleScroll = useCallback((e) => {
        requestAnimationFrame(() => {
            setScrollTop(e.target.scrollTop);
        });
    }, []);

    // Observer para resize
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerHeight(entry.contentRect.height);
            }
        });

        resizeObserver.observe(container);
        setContainerHeight(container.clientHeight);

        return () => resizeObserver.disconnect();
    }, []);

    if (items.length === 0) {
        return (
            <div className={`flex items-center justify-center py-12 text-gray-500 ${className}`}>
                {emptyMessage}
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            className={`overflow-auto no-scrollbar scroll-smooth ${className}`}
            style={{ position: 'relative' }}
        >
            {/* Spacer para altura total */}
            <div style={{ height: totalHeight, position: 'relative', width: '100%' }}>
                {/* Container dos itens visíveis */}
                <div
                    style={{
                        position: 'absolute',
                        top: offsetY,
                        left: 0,
                        right: 0,
                    }}
                >
                    {visibleItems.map((item, index) => (
                        <div
                            key={item.id || startIndex + index}
                            style={{ height: itemHeight }}
                        >
                            {renderItem(item, startIndex + index)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
